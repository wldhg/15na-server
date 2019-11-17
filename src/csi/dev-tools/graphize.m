% IRONA Server is subject to the terms of the Mozilla Public License 2.0.
% You can obtain a copy of MPL at LICENSE.md of repository root.

function graphize(timestamp, csi_one_ant, plot_title)
  clf;
  hold on;
  for i = 1:30
    plot(timestamp, csi_one_ant(i, :));
  end
  hold off;
  xlabel("Time (seconds)");
  ylabel("Amplitude (dB)");
  title(plot_title);
end
