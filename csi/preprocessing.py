# Widh Jio

import sys
import numpy as np
import matlab.engine as ma
import socket as soc
import pickle
eng = ma.start_matlab()
eng.addpath('./csi');

# Constants
SOCKET_PATH = sys.argv[1]
OPTIMIZE_FACTOR = int(sys.argv[2])
WINDOW_SIZE = int(sys.argv[3])
COL_START = int(sys.argv[4])
COL_END = int(sys.argv[5])
SLIDE_SIZE = int(sys.argv[6])
PIPE_PATH = sys.argv[7]
PP_ID = sys.argv[8]

COL_SIZE = COL_END - COL_START

# Open IPC Client
with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as node:
    node.connect(SOCKET_PATH)
    with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as pipe:
        pipe.connect(PIPE_PATH)

        while True:
            datPath = node.recv(1024).decode('utf-8')

            # Read Datfile
            print(" -- [", PP_ID, "] Converting to numpy style with optimizing...")
            cat = np.asarray(eng.process_dat(datPath, OPTIMIZE_FACTOR, PP_ID))

            # Get Windows
            print(" -- [", PP_ID, "] Calculate windows...")
            xx = np.empty([0, WINDOW_SIZE, COL_SIZE], float)
            while True:
                if len(cat) < WINDOW_SIZE:
                    break
                else:
                    window = np.dstack(
                        cat[0:WINDOW_SIZE,COL_START:COL_END].T
                    )
                    xx = np.concatenate((xx, window), axis=0)
                    cat = cat[SLIDE_SIZE:, :]

            # Get Scores
            print(" -- [", PP_ID, "] Sending to Keras predictor...")
            pipe.send(pickle.dumps(xx))
