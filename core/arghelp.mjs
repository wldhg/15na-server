// Widh Jio
// Program argument parsing & help module

import * as cs from './const'
import 'colors'

export const help = (arg, pkg, log) => {
  let isHelp =
        arg.fn.keyword === 'help' && arg.obj.length === 0

  return new Promise((resolve, reject) => {
    let help = []

    if (isHelp) {
      help.push(`${cs.APPNAME.bold.underline}: ${pkg.description}`)

      help.push(`Usage: ${cs.APPNAME_ABBR.bold} [FUNCTION] [OPTION]...`)

      let funcList = ['FUNCTION:']
      let keywordList = []
      let descList = []
      let longestKWLength = 0

      Object.values(cs.APP_FUNC).map(v => {
        let keywordString = ''

        if (typeof v.abbr === 'string') { keywordString = `${v.keyword}, ${v.abbr}` } else keywordString = v.keyword

        if (keywordString.length > longestKWLength) { longestKWLength = keywordString.length }

        keywordList.push(keywordString)

        descList.push(v.description)
      })

      longestKWLength += 6

      for (let i = 0; i < keywordList.length; i++) {
        let funcString = `  ${keywordList[i]}`
        let space = longestKWLength - keywordList[i].length

        for (let j = 0; j < space; j++) funcString += ' '

        funcList.push(funcString + descList[i])
      }

      help.push(funcList.join('\n'))

      help.push(
        `Enter ${
          (cs.APPNAME_ABBR + ' help FUNCTION').bold
        } for more information.`
      )
    } else {
      arg.obj.forEach(o => {
        let helpFound = false

        Object.values(cs.APP_FUNC).map(v => {
          if (
            o === v.keyword ||
                        o === v.abbr ||
                        (v.alias instanceof Array && v.alias.includes(o))
          ) {
            helpFound = true

            // Generate "Description" string
            help.push(`${o.bold.underline}: ${v.description}`)

            // Generate "Usage" string
            let usageList = []
            usageList.push(
              `Usage: ${cs.APPNAME_ABBR.bold} ${v.keyword} [OPTION]...`
            )

            if (typeof v.abbr === 'string') {
              usageList.push(
                `Usage: ${cs.APPNAME_ABBR.bold} ${v.abbr} [OPTION]...`
              )
            }

            if (v.alias instanceof Array) {
              v.alias.forEach(a => {
                usageList.push(
                  `Usage: ${cs.APPNAME_ABBR.bold} ${a} [OPTION]...`
                )
              })
            }

            help.push(usageList.join('\n'))

            // Generate "Options" string
            if (v.options instanceof Array) {
              let optionList = ['OPTION:']
              let flagList = []
              let descList = []
              let longestFlagLength = 0

              v.options.forEach(a => {
                if (typeof cs.APP_OPT[a] === 'object') {
                  let flagString = cs.APP_OPT[a].flags.join(
                    ', '
                  )

                  if (flagString.length > longestFlagLength) { longestFlagLength = flagString.length }

                  if (cs.APP_OPT[a].required) {
                    cs.APP_OPT[a].description = '(Required) ' + cs.APP_OPT[a].description
                  }

                  flagList.push(flagString)
                  descList.push(cs.APP_OPT[a].description)
                }
              })

              longestFlagLength += 6

              for (let i = 0; i < flagList.length; i++) {
                let optString = `  ${flagList[i]}`
                let space =
                                    longestFlagLength - flagList[i].length

                for (let j = 0; j < space; j++) { optString += ' ' }

                optionList.push(optString + descList[i])
              }

              if (optionList.length > 1) { help.push(optionList.join('\n')) }
            }
          }
        })

        if (!helpFound) {
          help.push(
            `${
              o.bold.underline
            }: There's no help manual for function "${o}".`
          )
        }
      })

      help.push(
        `Enter ${(cs.APPNAME_ABBR + ' help').bold} for available function list.`
      )
    }

    log.stdw(`\n${help.join('\n\n')}\n\n`)
  })
}

export const parse = function (e) {
  var analyzed = {
    fn: undefined,
    obj: []
  }

  var funcHelp = {
    keyword: 'help',
    abbr: 'h',
    alias: [],
    description: 'Displays this help message.',
    dockerStep: [],
    options: []
  }

  return new Promise((resolve, reject) => {
    if (process.argv.length < 2) {
      reject(
        e.make(
          0x1,
          'Argument input length is lack. Maybe running in unsupported environment.',
          { arguments: process.argv }
        )
      )
    } else if (process.argv.length === 2) process.argv.push(cs.APP_DEFFUNC)

    // Gather all available keywords
    let avKeywords = { help: funcHelp, h: funcHelp }
    for (var f in cs.APP_FUNC) {
      avKeywords[cs.APP_FUNC[f].keyword] = cs.APP_FUNC[f]
      avKeywords[cs.APP_FUNC[f].abbr] = cs.APP_FUNC[f]

      for (var i in cs.APP_FUNC[f].alias) avKeywords[cs.APP_FUNC[f].alias[i]] = cs.APP_FUNC[f]
    }

    // Gather all available options of main function
    let optKeywords = []
    for (var o in avKeywords[cs.APP_DEFFUNC].options) { optKeywords = optKeywords.concat(cs.APP_OPT[avKeywords[cs.APP_DEFFUNC].options[o]].flags) }

    let optDataComes = null
    let processArgs = (v, i, a) => {
      if (i === 0) {
        // Save function
        let defaultUsed = false
        if (typeof avKeywords[v] === 'object') { analyzed.fn = avKeywords[v] } else if (optKeywords.includes(v)) {
          analyzed.fn = avKeywords[cs.APP_DEFFUNC]
          defaultUsed = true
        } else {
          return reject(
            e.make(
              0x2,
              `${v}: Unknown function. Enter ${
                (cs.APPNAME_ABBR + ' help').white.bold.underline
              } for available function list.`
            )
          )
        }

        // Make option lists
        analyzed.optionSet = {}
        analyzed._reqOptList = []
        if (typeof analyzed.fn.options !== 'undefined') {
          for (var ai in analyzed.fn.options) {
            if (cs.APP_OPT[analyzed.fn.options[ai]].required) { analyzed._reqOptList.push(analyzed.fn.options[ai]) }
            for (var j in cs.APP_OPT[analyzed.fn.options[ai]].flags) {
              analyzed.optionSet[cs.APP_OPT[analyzed.fn.options[ai]].flags[j]] = analyzed.fn.options[ai]
            }
          }
        }

        // If option first, process that option.
        if (defaultUsed) { processArgs(v, 1, a) }
      } else {
        if (typeof optDataComes === 'string') {
          analyzed[optDataComes] = v
          optDataComes = null
        } else if (v in analyzed.optionSet) {
          let _reqIdx = analyzed._reqOptList.indexOf(
            analyzed.optionSet[v]
          )
          if (_reqIdx >= 0) {
            analyzed._reqOptList.splice(
              _reqIdx,
              1
            )
          }

          switch (cs.APP_OPT[analyzed.optionSet[v]].type) {
            // Next argument will not be this options data
            case 'ARGOPT_WITHOUT_DATA':
            case 'ARGOPT_NO_DATA':
              analyzed[analyzed.optionSet[v]] = true
              break

              // Next argument will be this options data
            case 'ARGOPT_WITH_DATA':
              optDataComes = analyzed.optionSet[v]
              break
          }
        } else if (v[0] === '-') {
          return reject(
            e.make(
              0x3,
              `${v}: Unknown option. Enter ${
                (cs.APPNAME_ABBR + ' help ' + analyzed.fn.keyword).white.bold
                  .underline
              } for available options.`
            )
          )
        } else analyzed.obj.push(v)
      }
    }
    process.argv.slice(2).forEach(processArgs)

    if (typeof optDataComes === 'string') { return reject(e.make(0x5, `Option value for '${optDataComes}' option is missing.`)) }

    if (analyzed._reqOptList.length > 0) {
      let arrForHelp = []

      for (var opt in analyzed._reqOptList) {
        let tempObj = {}
        tempObj[cs.APP_OPT[analyzed._reqOptList[opt]].flags.join(' or ')] = cs.APP_OPT[analyzed._reqOptList[opt]].description

        arrForHelp.push(tempObj)
      }

      return reject(e.make(0x4, "Required option doesn't set.", arrForHelp))
    } else {
      delete analyzed._reqOptList
      return resolve(analyzed)
    }
  })
}
