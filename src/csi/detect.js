/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as color from 'colors';

let predLog;
let predParseLog;
let isPredLogEnabled;

let labels;
let labelMaxLen = 0;
let labelString = '';
const labelColoring = [
  'gray', /* 0.00 <= x < 0.05 */
  'gray', /* 0.05 <= x < 0.10 */
  'gray', /* 0.10 <= x < 0.15 */
  'gray', /* 0.15 <= x < 0.20 */
  'gray', /* 0.20 <= x < 0.25 */
  'gray', /* 0.25 <= x < 0.30 */
  'reset', /* 0.30 <= x < 0.35 */
  'reset', /* 0.35 <= x < 0.40 */
  'reset', /* 0.40 <= x < 0.45 */
  'reset', /* 0.45 <= x < 0.50 */
  'blue', /* 0.50 <= x < 0.55 */
  'blue', /* 0.55 <= x < 0.60 */
  'blue', /* 0.60 <= x < 0.65 */
  'brightBlue', /* 0.65 <= x < 0.70 */
  'brightBlue', /* 0.70 <= x < 0.75 */
  'green', /* 0.75 <= x < 0.80 */
  'green', /* 0.80 <= x < 0.85 */
  'brightGreen', /* 0.85 <= x < 0.90 */
  'brightYellow', /* 0.90 <= x < 0.95 */
  'brightRed', /* 0.95 <= x < 1.00 */
  'bgBrightRed', /* x == 1.00 */
];

let targets;
let targetCond;
let targetRept;
let targetHistoryMax;
const targetHistory = {};

let predCount = 0;

let alert;
let predDebug = null;

export const init = (core, conf) => {
  // Set logger
  if (core.arg.dispPredResults) {
    predLog = (data) => {
      core.log(data, 'stat');
    };
    predParseLog = (data) => {
      core.log.debug(data, 'pred');
    };
    isPredLogEnabled = true;
  } else {
    predLog = function dummyLog() {};
    predParseLog = predLog;
    isPredLogEnabled = false;
  }

  // Save labels
  labels = conf.modelLabels;
  for (let i = 0; i < labels.length; i += 1) {
    if (labelMaxLen < labels[i].length) {
      labelMaxLen = labels[i].length;
    }
  }
  if (labelMaxLen < 7) {
    labelMaxLen = 7;
  }
  for (let i = 0; i < labels.length; i += 1) {
    let spaces = '';
    const spaceLen = labelMaxLen - labels[i].length + (i === labels.length - 1 ? 0 : 2);
    for (let j = 0; j < spaceLen; j += 1) spaces += ' ';
    labelString += `${labels[i]}${spaces}`;
  }

  // Save notification threshold
  targets = core.arg.notifID.split(',');
  targetCond = core.arg.notifProbCond;
  targetRept = core.arg.notifRepeatCond;
  targetHistoryMax = conf.predRemainingWindow;

  const newTargets = [];
  for (let i = 0; i < targets.length; i += 1) {
    targets[i] = Number(targets[i]);
    if (Number.isNaN(targets[i])) {
      core.log.warn(`Invalid target ID(s): ${core.arg.notifID}`);
    } else {
      newTargets.push(targets[i]);
      targetHistory[targets[i]] = {};
    }
  }
  targets = newTargets;
};

export const fromBuffer = (buf) => {
  try {
    const [data, aid] = JSON.parse(buf.toString().slice(0, -1)); // Remove Form Feed

    predLog(`${`[  ${labelString}  ]`.bold}     ${`Pred No. ${predCount += 1}`.grey}`);

    // If client debugging is enabled, send to them first.
    // In case of client debugging, it has more priority than other things.
    if (predDebug) {
      (new Promise((resolve) => {
        const dataByArea = {};
        for (let i = 0; i < aid.length; i += 1) {
          if (dataByArea[aid[i]]) {
            dataByArea[aid[i]].push(data[i]);
          } else {
            dataByArea[aid[i]] = [data[i]];
          }
        }
        resolve(dataByArea);
      })).then((dba) => {
        const areas = Object.keys(dba);
        for (let i = 0; i < areas.length; i += 1) {
          predDebug(areas[i], dba[areas[i]]);
        }
      });
    }

    for (let i = 0; i < data.length; i += 1) {
      const d = data[i];

      // Process console logging
      if (isPredLogEnabled) {
        const analysis = [];
        let approx;
        let approxProb = 0;
        for (let j = 0; j < d.length; j += 1) {
          const numProb = Number(d[j]);
          analysis.push(
            color.default[
              labelColoring[Math.floor(numProb * 20)]
            ](numProb.toFixed(labelMaxLen - 2)),
          );
          if (numProb > approxProb) {
            approxProb = numProb;
            approx = j;
          }
        }
        predLog(`   ${analysis.join('  ')}     →  ${labels[approx]} (${approxProb >= targetCond ? ' ✔' : '❌ '})`);
      }

      // Process fall
      for (let j = 0; j < targets.length; j += 1) {
        const target = targets[j];
        const fallProb = Number(d[target]);
        if (fallProb > 0.9999) {
          alert(aid[i], fallProb);
        } else {
          if (!targetHistory[target][aid[i]]) {
            targetHistory[target][aid[i]] = [];
          }
          targetHistory[target][aid[i]].push(fallProb);
          if (targetHistory[target][aid[i]].length > targetHistoryMax) {
            targetHistory[target][aid[i]].splice(0, 1);
          }
          if (fallProb >= targetCond) {
            let history = 0;
            let historySum = 0;
            for (let k = 0; k < targetHistory[target][aid[i]].length; k += 1) {
              if (targetHistory[target][aid[i]][k] >= targetCond) {
                historySum += targetHistory[target][aid[i]][k];
                history += 1;
              }
            }
            if (history > targetRept) alert(aid[i], historySum / history);
          }
        }
      }
    }
  } catch (e) {
    predLog('Wrong data input! throw this.');
    predParseLog(e);
  }
};

export const setPredictionDebugger = (fn) => {
  predDebug = fn;
};

export const setAlerter = (fn) => {
  alert = fn;
};
