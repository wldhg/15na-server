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
import numpy as np
import schedule

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
PIPE_BUFSIZE = 2**int(sys.argv[5])
WINDOW_ROW = int(sys.argv[6])
WINDOW_COL = int(sys.argv[7])
PRED_INTERVAL = int(sys.argv[8])

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
model._make_predict_function()

# Open IPC
xxLock = th.Lock()
with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as node:
    node.connect(SOCKET_PATH)
    xxWaitList = np.empty([0, WINDOW_ROW, WINDOW_COL], float)

    def predict():
        global model, xxLock, node, xxWaitList, WINDOW_ROW, WINDOW_COL
        if len(xxWaitList) > 0:
            print(" -- [ PRED ] Predicting now...")
            xxLock.acquire()
            xx = xxWaitList.copy()
            xxWaitList = np.empty([0, WINDOW_ROW, WINDOW_COL], float)
            xxLock.release()
            scores = model.predict(xx)
            node.send((json.dumps(scores.tolist()) + '\f').encode())
        else:
            print(" -- [ PRED ] No waiting xx...")

    def procWindow(prep, addr):
        global xxLock, schedule, xxWaitList
        while True:
            try:
                xx = pickle.loads(prep.recv(PIPE_BUFSIZE))
                print(" -- [ PRED ] Received pickle...")
                xxLock.acquire()
                xxWaitList = np.concatenate((xxWaitList, xx), axis=0)
                xxLock.release()
            except pickle.UnpicklingError:
                print(" -- [ PRED ] Unpickling Error occured!")
            schedule.run_pending()

    schedule.every(PRED_INTERVAL).seconds.do(predict)

    with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as pipe:
        pipe.bind(PIPE_PATH)
        pipe.listen(PREP_CNT)
        while True:
            acceptedPipe = pipe.accept()
            th.Thread(target=procWindow, args=acceptedPipe).start()
