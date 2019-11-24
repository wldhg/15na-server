/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Program argument parsing & help module

import 'colors';

let err;

/**
 * Set error module.
 * @param {*} parserr Error module of {@link parserr.js}
 */
export const setErrorModule = (parserr) => {
  err = parserr;
};


/**
 * This prints help to standard output.
 * @param {Object} config Kernel config object.
 * @param {Object} arg Analyzed arguments.
 */
export const printHelp = (config, arg) => {
  const helpConstructor = new Promise((resolve, reject) => {
    const help = [];
    if (arg.help === true && !arg.fn.isDefault) {
      help.push(`${arg.fn.keyword.bold.underline}: ${arg.fn.description}`);

      // Generate "Usage" string
      const usageList = [];
      let nameList = [arg.fn.keyword];
      if (arg.fn.abbr) {
        nameList.push(arg.fn.abbr);
      }
      if (arg.fn.alias) {
        nameList = nameList.concat(arg.fn.alias);
      }
      nameList.forEach((callName) => {
        usageList.push(
          `Usage: ${config.name.abbr.bold} ${callName} [OPTION]...`,
        );
      });
      help.push(usageList.join('\n'));


      const optionList = ['OPTION:'];
      if (arg.fn.options && arg.fn.options.length > 0) {
        const flagList = [];
        const descList = [];
        let longestFlagLength = 0;

        arg.fn.options.forEach((opt) => {
          if (typeof config.arg.opt[opt] === 'object') {
            const flagString = config.arg.opt[opt].flags.join(', ');

            if (flagString.length > longestFlagLength) {
              longestFlagLength = flagString.length;
            }

            flagList.push(flagString);
            descList.push(config.arg.opt[opt].description);
          } else {
            reject(
              err.make(`Option object does not exists: ${opt}`),
            );
          }
        });

        longestFlagLength += 6;

        for (let i = 0; i < flagList.length; i += 1) {
          let optString = `  ${flagList[i]}`;
          const space = longestFlagLength - flagList[i].length;

          for (let j = 0; j < space; j += 1) {
            optString += ' ';
          }

          optionList.push(optString + descList[i]);
        }
      } else {
        optionList.push('  No options available for this function.');
      }
      help.push(optionList.join('\n'));

      help.push(
        `Enter ${(`${config.name.abbr} help`).bold} for available function list.`,
      );
    } else if (arg.fn.keyword === 'help' || (arg.fn.isDefault && arg.help)) {
      help.push(`${config.name.full.bold.underline}: ${config.description}`);
      help.push(`Usage: ${config.name.abbr.bold} [FUNCTION] [OPTION]...`);

      const funcList = ['FUNCTION:'];
      const keywordList = [];
      const descList = [];
      let longestKWLength = 0;

      Object.values(config.arg.fn).forEach((v) => {
        let keywordString = '';

        if (typeof v.abbr === 'string') {
          keywordString = `${v.keyword}, ${v.abbr}`;
        } else {
          keywordString = v.keyword;
        }
        if (keywordString.length > longestKWLength) {
          longestKWLength = keywordString.length;
        }

        keywordList.push(keywordString);
        descList.push(v.description);
      });

      longestKWLength += 6;

      for (let i = 0; i < keywordList.length; i += 1) {
        let funcString = `  ${keywordList[i]}`;
        const space = longestKWLength - keywordList[i].length;

        for (let j = 0; j < space; j += 1) funcString += ' ';

        funcList.push(funcString + descList[i]);
      }

      help.push(funcList.join('\n'));
      help.push(
        `Type ${
          (`${config.name.abbr} FUNCTION --help`).bold
        } for more information.`,
      );
    } else {
      reject(
        err.make('It\'s not a case of printing help message.'),
      );
    }

    resolve(process.stdout.write(`\n${help.join('\n\n')}\n\n`));
  });
  return helpConstructor;
};

/**
 * Parses process arguments and return analyzed result as object.
 * @param {Object} config Kernel config object.
 * @param {String} command Program-launching command
 */
export const parse = (config, command) => {
  const analyzed = {};

  return new Promise((resolve, reject) => {
    // Gather all available keywords
    const availableKeywords = {
      help: {
        keyword: 'help',
        description: 'Displays this help message.',
      },
    };
    const functions = Object.keys(config.fn);
    for (let i = 0; i < functions.length; i += 1) {
      const fn = config.fn[functions[i]];
      availableKeywords[fn.keyword] = fn;
      if (fn.abbr && fn.abbr.length > 0) {
        availableKeywords[fn.abbr] = fn;
      }
      if (fn.alias && fn.alias.length > 0) {
        fn.alias.forEach((alias) => {
          availableKeywords[alias] = fn;
        });
      }
    }

    // Get the keyword of main function
    let mainKeyword;
    let isDefault = false;
    if (process.argv.length < 2) {
      reject(
        err.make(
          'Argument input length is lack. Maybe running in unsupported environment.',
          { arguments: process.argv },
        ),
      );
    } else if (process.argv.length === 2 || process.argv[2].charAt(0) === '-') {
      mainKeyword = config.fn.default.keyword;
      isDefault = true;
    } else {
      // eslint-disable-next-line prefer-destructuring
      mainKeyword = process.argv[2];
    }

    // Get main function or throw error
    let mainFn;
    if (Object.keys(availableKeywords).includes(mainKeyword)) {
      mainFn = availableKeywords[mainKeyword];
      analyzed.fn = mainFn;
      analyzed.fn.isDefault = isDefault;
    } else {
      reject(
        err.make(
          `${mainKeyword}: Unknown function. Enter ${
            (`${command} help`).white.bold.underline
          } for the list of available functions.`,
        ),
      );
    }

    // Gather all available options of main function
    const helpOption = {
      flags: ['-h', '--help'],
      type: 'flag',
      description: 'Display help message.',
      required: false,
      name: 'help',
    };
    const availableOptionKeywords = {
      '-h': helpOption,
      '--help': helpOption,
    };
    const requiredOptionsNames = [];
    const requiredOptions = [];
    if (mainFn.options) {
      for (let i = 0; i < mainFn.options.length; i += 1) {
        const opt = config.opt[mainFn.options[i]];
        opt.name = mainFn.options[i];
        if (opt.required) {
          requiredOptionsNames.push(mainFn.options[i]);
          requiredOptions.push(opt);
        }
        opt.flags.forEach((flag) => {
          availableOptionKeywords[flag] = opt;
        });
      }
    }

    // Create type checking function
    const trueStrings = ['y', 'yes', 'on', 'true', 't', '1'];
    const falseStrings = ['n', 'no', 'off', 'false', 'f', '0'];
    const refineValue = (arg, type) => {
      let result;
      switch (type) {
        default: {
          reject(
            err.make(`Unknown option type declaration: ${type}`),
          );
          break;
        }
        case 'bool':
        case 'boolean': {
          if (trueStrings.includes(arg)) {
            result = true;
          } else if (falseStrings.includes(arg)) {
            result = false;
          } else {
            reject(
              err.make(`This argument must be 'true' or 'false': ${arg}`),
            );
          }
          break;
        }
        case 'num':
        case 'number': {
          result = Number(arg);
          if (Number.isNaN(result)) {
            reject(
              err.make(`This must be a number: ${arg}`),
            );
          }
          break;
        }
        case 'str':
        case 'string': {
          result = arg;
          break;
        }
      }
      return result;
    };

    // Parse all optional arguments
    let dataRequired = 0;
    let dataRequiredOriginal = 0;
    let dataType;
    let dataName;
    let dataPool;
    let isMultipleInput = false;
    process.argv.slice(analyzed.fn.isDefault ? 2 : 3).forEach((arg) => {
      if (dataRequired > 0) {
        const parsedValue = refineValue(arg, dataType);
        if (isMultipleInput) {
          dataPool[dataName].push(parsedValue);
        } else {
          dataPool[dataName] = parsedValue;
        }
        dataRequired -= 1;
      } else if (arg.charAt(0) === '-') {
        const selectedOption = availableOptionKeywords[arg];
        if (selectedOption) {
          if (selectedOption.required) {
            const reqOptIndex = requiredOptionsNames.indexOf(selectedOption.name);
            if (reqOptIndex > -1) {
              requiredOptionsNames.splice(reqOptIndex, 1);
              requiredOptions.splice(reqOptIndex, 1);
            }
          }
          if (selectedOption.type === 'flag') {
            analyzed[selectedOption.name] = true;
          } else {
            if (selectedOption.multiple) {
              if (!analyzed[selectedOption.name]) analyzed[selectedOption.name] = [];
              dataPool = analyzed[selectedOption.name];
              dataName = dataPool.length;
              dataType = selectedOption.type;
            } else {
              dataPool = analyzed;
              dataName = selectedOption.name;
              dataType = selectedOption.type;
            }
            if (selectedOption.inputCount && selectedOption.inputCount > 1) {
              isMultipleInput = true;
              dataRequired = selectedOption.inputCount;
              dataRequiredOriginal = selectedOption.inputCount;
              dataPool[dataName] = [];
            } else {
              isMultipleInput = false;
              dataRequired = 1;
              dataRequiredOriginal = 1;
            }
          }
        } else {
          reject(
            err.make(`Unknown option keyword: ${arg}`),
          );
        }
      } else {
        reject(
          err.make(`Unexpected value appeared: ${arg}. Option keyword starts with '-' or '--' expected.`),
        );
      }
    });

    // Check whether if is not finished
    if (analyzed.help !== true) {
      if (dataRequired > 0) {
        reject(
          err.make(`Argument is lacked. ${dataName} requires ${dataRequiredOriginal} values but ${dataRequiredOriginal - dataRequired} values were entered.`),
        );
      } else if (requiredOptionsNames.length > 0) {
        const requiredFlags = [];
        requiredOptions.forEach((opt) => {
          requiredFlags.push(opt.flags);
        });
        reject(
          err.make('Following options were required, but not entered.', requiredFlags),
        );
      }
    }

    return resolve(analyzed);
  });
};
