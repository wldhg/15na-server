% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

function ret = preprocess( ...
    datPath, ppid, redRes64, pps64, procAmp, procPhase, colPerPair64, tx_str, rx_str )

  redRes = double(redRes64);
  pps = double(pps64);
  colPerPair = double(colPerPair64);

  if (redRes ~= 1)
    raw_data = read_bf_file_partial(datPath, redRes);
  else
    raw_data = read_bf_file(datPath);
  end

  % Extract CSI information for each packet
  fprintf('>> [PREP - %s]   ~> Have CSI for %d packets\n', ppid, length(raw_data));

  % Check Tx/Rx count -- Do this in here cuz Tx/Rx config can change from outside.
  % From here, use ltx|lrx instead raw_data{1}.Ntx|Nrx.
  tx = arrayfun(@(s) str2double(s),split(tx_str, ',')');
  rx = arrayfun(@(s) str2double(s),split(rx_str, ',')');
  if (raw_data{1}.Ntx < max(tx) || raw_data{1}.Nrx < max(rx))
    fprintf('>> [PREP - %s]   ~> Tx/Rx does not match. Stop these packets.\n', ppid);
    return;
  end
  ltx = length(tx);
  lrx = length(rx);
  lrx30 = lrx * 30;
  lpair = ltx * lrx;

  % zeros(CSI data length, antenna, antenna, subcarriers (groupped by Intel 5300))
  ocsi = zeros(length(raw_data), raw_data{1}.Ntx, raw_data{1}.Nrx, 30);
  timestamp = zeros(length(raw_data), 1);

  % Scaled into linear
  fprintf('>> [PREP - %s]   ~> Scaling into linear\n', ppid);
  ocsi(1,:,:,:) = get_scaled_csi(raw_data{1});
  zero_timestamp = raw_data{1}.timestamp_low;
  addi_timestamp = 0;
  timestamp(1) = 0;
  for pidx = 2:length(raw_data)
    ocsi(pidx,:,:,:) = get_scaled_csi(raw_data{pidx});
    if raw_data{pidx}.timestamp_low < raw_data{pidx - 1}.timestamp_low
      % Timestamp Reset
      addi_timestamp = addi_timestamp + raw_data{pidx - 1} - zero_timestamp;
      zero_timestamp = 0;
    end
    timestamp(pidx) = (raw_data{pidx}.timestamp_low - zero_timestamp + addi_timestamp) * 1.0e-6;
  end

  % Consider uniqueness
  [timestamp, uni] = unique(timestamp);
  ocsi = ocsi(uni, :, :, :);

  % Select tx/rx pairs -- Filter TR Pair in here
  csi = zeros(length(uni), ltx, lrx, 30);
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
    fprintf('>> [PREP - %s]   ~> Applying filters to amplitude\n', ppid);
    for t = 1:ltx
      for r = 1:lrx
        for ch = 1:30
          csi_amp(t, r, ch, :) = interp1(timestamp, ...
            reshape(ocsi_amp(t, r, ch, :), [1, length(uni)]), ...
            interpolated_timestamp);
        end
      end
    end
  end
  if (procPhase)
    fprintf('>> [PREP - %s]   ~> Permuting phase\n', ppid);
    ocsi_phase = permute(angle(csi), [2 3 4 1]);
    partial_phase = zeros(30, length(uni));
    csi_phase = zeros(ltx, lrx, 30, lpkt);
    fprintf('>> [PREP - %s]   ~> Calibrating & filtering phase\n', ppid);
    for k = 1:ltx
      for m = 1:lrx
        for j = 1:length(uni)
          partial_phase(:, j) = phase_calibration(ocsi_phase(k, m, :, j));
        end
        for ch = 1:30
          csi_phase(k, m, ch, :) = interp1(timestamp, ...
            partial_phase(ch, :), ...
            interpolated_timestamp);
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
        ccAmp = horzcat( ...
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]) );
        ccPhase = horzcat( ...
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]) );
        ret(pidx, :) = horzcat(ccAmp, ccPhase);
      end
    else
      for pidx = 1:lpkt
        ccAmp = horzcat( ...
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(3, :, :, pidx))', [1, lrx30]) );
        ccPhase = horzcat( ...
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(3, :, :, pidx))', [1, lrx30]) );
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
        ret(pidx, :) = horzcat( ...
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]) );
      end
    else
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat( ...
          reshape(squeeze(csi_amp(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(2, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_amp(3, :, :, pidx))', [1, lrx30]) );
      end
    end
  elseif (procPhase)
    if (ltx == 1)
      for pidx = 1:lpkt
        ret(pidx, :) = reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]);
      end
    elseif (ltx == 2)
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat( ...
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]) );
      end
    else
      for pidx = 1:lpkt
        ret(pidx, :) = horzcat( ...
          reshape(squeeze(csi_phase(1, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(2, :, :, pidx))', [1, lrx30]), ...
          reshape(squeeze(csi_phase(3, :, :, pidx))', [1, lrx30]) );
      end
    end
  end

  fprintf('>> [PREP - %s]   ~> Finished\n', ppid);
end
