/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

let notiLog;
let predLog;
let isPredLogEnabled;

let labels;
let labelMaxLen;
let labelString = '';

let targets;
let targetCond;
let targetRept;
let targetHistoryMax;
const targetHistory = {};

let predCount = 0;

let alert;

export const init = (core, conf) => {
  // Set logger
  notiLog = core.log.okay;
  if (core.arg.dispPredResults) {
    predLog = (data) => {
      core.log(data, 'Statics');
    };
    isPredLogEnabled = true;
  } else {
    predLog = function dummyLog() {};
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

    predLog(`Detection [ ${labelString} ] (${predCount += 1})`);

    for (let i = 0; i < data.length; i += 1) {
      const d = data[i];

      // Process logging
      if (isPredLogEnabled) {
        const analysis = [];
        let approx;
        let approxProb;
        for (let j = 0; j < d.length; j += 1) {
          const numProb = Number(d[j]);
          analysis.push(numProb.toFixed(labelMaxLen));
          if (numProb > approxProb) {
            approxProb = numProb;
            approx = j;
          }
        }
        predLog(`Detection [ ${analysis.join('  ')} ] → ${labels[approx]} (${approxProb >= targetCond ? '✔' : '❌'})`);
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
  }
};

export const setAlerter = (fn) => {
  alert = (prob) => {
    notiLog('😶 FALL DETECTED!');
    fn(prob);
  };
};
