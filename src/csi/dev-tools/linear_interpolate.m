% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

function ret = interpolate(pps, timestamp, csi_one_ant)
  for i = 1:30
    csi_one_ant(i, :) = hampel(csi_one_ant(i, :), 4, 2);
  end
  ret = csi_one_ant;
end
