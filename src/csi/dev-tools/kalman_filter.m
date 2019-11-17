% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

% Implements Extended Kalman Filter
function ret = kalman_filter(noise_const, csi_one_ant)
  for i = 1:30
    % Now in development.
    %for pidx = 1:length(csi_one_ant(i, :))
    %  % Calculate covariance (Prediction)
    %
    %
    %  cov_state = cov(csi_one_ant(i, :)) + noise_const;
    %
    %  % Measurement Update
    %
    %  csi_one_ant(i, :) = ;
    %end
    csi_one_ant(i, :) = csi_one_ant(i, :);
  end
  ret = csi_one_ant;
end
