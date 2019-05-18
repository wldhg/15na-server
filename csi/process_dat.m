function ret = process_dat(path, optim, ppid)
    raw_data = read_bf_file(path, optim);
    ppint = str2num(ppid);

    % eliminate empty cell
    empty_cells = find(cellfun('isempty', raw_data));
    raw_data(empty_cells) = [];

    % Extract CSI information for each packet
    fprintf(' -- [ %d ]   ~> Have CSI for %d packets\n', ppint, length(raw_data));

    % zeros(CSI data length, antenna, antenna, subcarriers (groupped by Intel 5300))
    csi = zeros(length(raw_data), raw_data{1}.Ntx, raw_data{1}.Nrx, 30);
    timestamp = zeros(1, length(raw_data));

    % Scaled into linear
    fprintf(' -- [ %d ]   ~> Scaling into linear\n', ppint);
    for pidx = 1:length(raw_data)
        csi(pidx,:,:,:) = get_scaled_csi(raw_data{pidx});
        timestamp(pidx) = (raw_data{pidx}.timestamp_low - raw_data{1}.timestamp_low) * 1.0e-6;
    end
    timestamp = timestamp';

    % File export
    fprintf(' -- [ %d ]   ~> Permuting amplitude and phase\n', ppint);
    csi_amp = permute(db(abs(csi) + 1), [2 3 4 1]);
    csi_phase = permute(angle(csi), [2 3 4 1]);

    fprintf(' -- [ %d ]   ~> Calibrating phase\n', ppint);
    for k = 1:raw_data{1}.Ntx
        for m = 1:raw_data{1}.Nrx
            for j = 1:length(raw_data)
                csi_phase_calibrated(k, m, :, j) = phase_calibration(csi_phase(k, m, :, j));
            end
        end
    end

    fprintf(' -- [ %d ]   ~> Merging into windows\n', ppint);
    temp = zeros(length(raw_data), 60 * (raw_data{1}.Ntx * raw_data{1}.Nrx));
    for pidx = 1:length(raw_data)
        catenAmp = reshape(squeeze(csi_amp(1,:,:,pidx))', [1, 90]);
        catenPhase = reshape(squeeze(csi_phase_calibrated(1,:,:,pidx))', [1, 90]);
        if raw_data{1}.Ntx > 2
            for ntx = 2:raw_data{1}.Ntx
                catenAmp = horzcat(catenAmp, reshape(squeeze(csi_amp(ntx,:,:,pidx))', [1, 90]));
                catenPhase = horzcat(catenPhase, reshape(squeeze(csi_phase_calibrated(ntx,:,:,pidx))', [1, 90]));
            end
        end
        temp(pidx, :) = horzcat(catenAmp, catenPhase);
    end

    fprintf(' -- [ %d ]   ~> Horzcat\n', ppint);
    ret = horzcat(timestamp, temp);
end
