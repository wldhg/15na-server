# Widh Jio

import sys
import keras.models as km
print(sys.argv)
# Set File Names
modelName = sys.argv[2] + "/model.h5"
modelProp = sys.argv[2] + "/model.yml"

# Compile Model
modelPropRaw = open(modelProp, 'r')
if 'json' in modelProp:
    model = km.model_from_json(modelPropRaw)
else:
    model = km.model_from_yaml(modelPropRaw)
model.load_weights(modelName)
model.compile(loss='categorical_crossentropy', optimizer='adam')

import gc
import numpy as np
import matlab.engine as ma
eng = ma.start_matlab()
eng.addpath('./csi');

# Constants
WINDOW_SIZE = int(sys.argv[4])
COL_START = int(sys.argv[5])
COL_END = int(sys.argv[6])
SLIDE_SIZE = int(sys.argv[7])

# Open IPC Client
import socket as soc
import json
with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as s:
    s.connect(sys.argv[1])
    while True:
        datPath = s.recv(1024).decode('utf-8')

        # Read Datfile
        ocat = np.asarray(eng.process_dat(datPath))
        cat = ocat[::int(sys.argv[3]), :]

        # Get Windows
        xx = np.zeros((
            int((ocat.shape[0] - WINDOW_SIZE) // SLIDE_SIZE + 1),
            int(WINDOW_SIZE),
            COL_END - COL_START
        ), float)
        ai = 0
        while True:
            if len(cat) < WINDOW_SIZE:
                break
            else:
                window = np.dstack(
                    cat[0:int(WINDOW_SIZE),COL_START:COL_END].T
                )
                xx[ai] = window
                ai += 1
                cat = cat[SLIDE_SIZE:, :]

        # Get Scores
        scores = model.predict(xx)
        s.send((json.dumps(scores.tolist()) + '\f').encode())
