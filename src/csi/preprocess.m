% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

function ret = preprocess(
    datPath, ppid, redRes, pps, procAmp, procPhase, colPerPair, tx, rx
  )

  if (redRes ~= 1)
    raw_data = read_bf_file_partial(datPath, redRes);
  else
    raw_data = read_bf_file(datPath);
  end

  % Extract CSI information for each packet
  fprintf('>> [PREP - %s]   ~> Have CSI for %d packets\n', ppid, length(raw_data));

  % Check Tx/Rx count -- Do this in here cuz Tx/Rx config can change from outside.
  % From here, use ltx|lrx instead raw_data{1}.Ntx|Nrx.
  if (raw_data{1}.Ntx < max(tx) || raw_data{1}.Nrx < max(rx))
    fprintf('>> [PREP - %s]   ~> Tx/Rx does not match. Stop these packets.\n', ppid, length(raw_data));
    return;
  end
  ltx = length(tx);
  lrx = length(rx);
  lrx30 = lrx * 30;
  lpair = ltx * lrx;

  % zeros(CSI data length, antenna, antenna, subcarriers (groupped by Intel 5300))
  ocsi = zeros(length(raw_data), raw_data{1}.Ntx, raw_data{1}.Nrx, 30);
  csi = zeros(length(raw_data), ltx, lrx, 30);
  timestamp = zeros(length(raw_data), 1);

  % Scaled into linear with selection tx/rx pairs -- Filter TR Pair in here
  fprintf('>> [PREP - %s]   ~> Scaling into linear\n', ppid);
  for pidx = 1:length(raw_data)
    ocsi(pidx, :, :, :) = get_scaled_csi(raw_data{pidx});
    timestamp(pidx) = (raw_data{pidx}.timestamp_low - raw_data{1}.timestamp_low) * 1.0e-6;
  end
  for txi = 1:ltx
    for rxi = 1:lrx
      csi(:, txi, rxi, :) = ocsi(:, tx(txi), rx(rxi), :);
    end
  end
  interpolated_timestamp = 0:(1/pps):timestamp(length(timestamp));
  lpkt = length(interpolated_timestamp);

  % Convert to real values & preprocess (amp & phase) -- Filter Phase/Amp in here
  if (procAmp)
    fprintf('>> [PREP - %s]   ~> Permuting amplitude\n', ppid);
    ocsi_amp = permute(db(abs(csi) + 1), [2 3 4 1]);
    csi_amp = zeros(ltx, lrx, 30, lpkt);
    fprintf('>> [PREP - %s]   ~> Applying Hampel filter to amplitude\n', ppid);
    for t = 1:ltx
      for r = 1:lrx
        for ch = 1:30
          csi_amp(t, r, ch, :) =
            interp1(
              timestamp,
              hampel(ocsi_amp(t, r, ch, :), 6, 1.6),
              interpolated_timestamp
            );
        end
      end
    end
  end
  if (procPhase)
    fprintf('>> [PREP - %s]   ~> Permuting phase\n', ppid);
    ocsi_phase = permute(angle(csi), [2 3 4 1]);
    csi_phase = zeros(ltx, lrx, 30, lpkt);
    fprintf('>> [PREP - %s]   ~> Calibrating phase\n', ppid);
    for k = 1:ltx
      for m = 1:lrx
        for j = 1:length(raw_data)
          csi_phase_calibrated(k, m, :, j) = phase_calibration(csi_phase(k, m, :, j));
        end
        for ch = 1:30
          csi_phase(k, m, ch, :) = interp1(timestamp, csi_phase_calibrated(k, m, ch, :), interpolated_timestamp);
        end
      end
    end
  end

  % Export to windows
  fprintf('>> [PREP - %s]   ~> Merging into windows\n', ppid);
  ret = zeros(lpkt, colPerPair * lpair);
  if (procPhase && procAmp)
    if (ltx == 1)
      for pidx = 1:lpkt
        ccAmp = reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]);
        ccPhase = reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]);
        ret(pidx, :) = horzcat(ccAmp, ccPhase);
      end
    elseif (ltx == 2)
      for pidx = 1:lpkt
        ccAmp = horzcat(
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30])
        );
        ccPhase = horzcat(
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30])
        );
        ret(pidx, :) = horzcat(ccAmp, ccPhase);
      end
    else
      for pidx = 1:lpkt
        ccAmp = horzcat(
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(3, :, :, pidx))', [1, lrx30])
        );
        ccPhase = horzcat(
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(3, :, :, pidx))', [1, lrx30])
        );
        ret(pidx, :) = horzcat(ccAmp, ccPhase);
      end
    end
  elseif (procAmp)
    if (ltx == 1)
      for pidx = 1:lpkt
        ret(pidx, :) = reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]);
      end
    elseif (ltx == 2)
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat(
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30])
        );
      end
    else
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat(
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_amp(3, :, :, pidx))', [1, lrx30])
        );
      end
    end
  else
    if (ltx == 1)
      for pidx = 1:lpkt
        ret(pidx, :) = reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]);
      end
    elseif (ltx == 2)
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat(
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30])
        );
      end
    else
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat(
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]),
          reshape(squeeze(csi_phase(3, :, :, pidx))', [1, lrx30])
        );
      end
    end
  end

  fprintf('>> [PREP - %s]   ~> Finished\n', ppid);
end
