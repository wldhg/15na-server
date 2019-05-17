# Widh Jio

import sys
import os
import keras.models as km
import keras.backend as K

# Set Keras Core
KERAS_CORE = int(sys.argv[8])
os.environ['OMP_NUM_THREADS'] = sys.argv[8]
os.environ['KMP_AFFINITY'] = "noverbose,warnings,norespect,granularity=group,scatter,0,0"
K.set_session(K.tf.Session(config=K.tf.ConfigProto(intra_op_parallelism_threads=KERAS_CORE, inter_op_parallelism_threads=KERAS_CORE)))

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
        print("MATLAB Phase...")
        cat = np.asarray(eng.process_dat(datPath, int(sys.argv[3])))
        print("Python Phase...")

        # Get Windows
        xx = np.empty([0, int(WINDOW_SIZE), COL_END - COL_START], float)
        while True:
            if len(cat) < WINDOW_SIZE:
                break
            else:
                window = np.dstack(
                    cat[0:int(WINDOW_SIZE),COL_START:COL_END].T
                )
                xx = np.concatenate((xx, window), axis=0)
                cat = cat[SLIDE_SIZE:, :]

        # Get Scores
        print("Keras Phase...")
        scores = model.predict(xx)
        print("End...")
        s.send((json.dumps(scores.tolist()) + '\f').encode())
