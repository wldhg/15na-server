# Widh Jio

import pickle
import json
import threading as th
import socket as soc
import sys
import os
import multiprocessing as mp
import keras.models as km
import keras.backend as K

# Set Keras Core
MAX_CORE = mp.cpu_count()
os.environ['OMP_NUM_THREADS'] = str(MAX_CORE)
os.environ['KMP_AFFINITY'] = "noverbose,warnings,norespect,granularity=thread,scatter,0,0"
K.set_session(K.tf.Session(config=K.tf.ConfigProto(
    intra_op_parallelism_threads=MAX_CORE,
    inter_op_parallelism_threads=MAX_CORE
)))

# Constants
SOCKET_PATH = sys.argv[1]
MODEL_DIR = sys.argv[2]
PIPE_PATH = sys.argv[3]
PREP_CNT = int(sys.argv[4])

# Set File Names
modelName = MODEL_DIR + "/model.h5"
modelProp = MODEL_DIR + "/model.yml"

# Compile Model
modelPropRaw = open(modelProp, 'r')
if 'json' in modelProp:
    model = km.model_from_json(modelPropRaw)
else:
    model = km.model_from_yaml(modelPropRaw)
model.load_weights(modelName)
model.compile(loss='categorical_crossentropy', optimizer='adam')

# Open IPC

with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as node:
    node.connect(SOCKET_PATH)

    def procWindow(prep, addr):
        while True:
            xx = pickle.loads(prep.recv(2097152), encoding='bytes')
            print(" -- [ PRED ] Received pickle...")
            scores = model.predict(xx)
            print(" -- [ PRED ] Predicted...")
            node.send((json.dumps(scores.tolist()) + '\f').encode())
    with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as pipe:
        pipe.bind(PIPE_PATH)
        pipe.listen(PREP_CNT)
        while True:
            acceptedPipe = pipe.accept()
            th.Thread(procWindow, acceptedPipe)
