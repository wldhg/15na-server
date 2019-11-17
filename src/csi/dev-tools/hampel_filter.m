% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

function ret = linear_interpolate(original_timestamp, original_csi, interpolated_timestamp, interpolated_csi)
  for i = 1:30
    interpolated_csi(i, :) = interp1(original_timestamp, original_csi(i, :)', interpolated_timestamp);
  end
  ret = interpolated_csi;
end
