# Widh Jio

import pickle
import json
import threading as th
import socket as soc
import sys
import os
import multiprocessing as mp
import keras.models as km
import keras.utils as ku
import keras.backend as K
import numpy as np
import time

# Set Keras Core
MAX_CORE = mp.cpu_count()
os.environ['OMP_NUM_THREADS'] = str(MAX_CORE)
os.environ['KMP_AFFINITY'] = "noverbose,warnings,norespect,granularity=thread,scatter,0,0"
K.set_session(K.tf.Session(config=K.tf.ConfigProto(
    intra_op_parallelism_threads=MAX_CORE,
    inter_op_parallelism_threads=MAX_CORE
)))

# Shut down tensorflow log
os.environ['TF_CPP_MIN_LOG_LEVEL'] = "2"
K.tf.logging.set_verbosity(K.tf.logging.ERROR)

# Constants
SOCKET_PATH = sys.argv[1]
MODEL_DIR = sys.argv[2]
PIPE_PATH = sys.argv[3]
PREP_CNT = int(sys.argv[4])
PIPE_BUFSIZE = 2**int(sys.argv[5])
WINDOW_ROW = int(sys.argv[6])
WINDOW_COL = int(sys.argv[7])
PRED_INTERVAL = int(sys.argv[8])
PRED_GPU = int(sys.argv[9])

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
if K.tensorflow_backend._get_available_gpus():
    print(" -- [ PRED ] Using multi gpus:", PRED_GPU)
    model = ku.multi_gpu_model(model, gpus=PRED_GPU)
model.compile(loss='categorical_crossentropy', optimizer='adam')
model.predict(np.zeros([1, WINDOW_ROW, WINDOW_COL]))

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

    class Predictor(th.Thread):
        def __init__ (self, sleep=8):
            th.Thread.__init__(self, name='Predictor')
            self.stop_event = th.Event()
            self.sleep = sleep
        def run (self):
            while self.sleep > 0 and not self.stop_event.is_set():
                th.Thread(target=predict).start()
                time.sleep(self.sleep)
        def stop (self):
            self.stop_event.set()
        def __enter__ (self):
            return self
        def __exit__ (self, *args, **kwargs):
            self.stop()

    def procWindow(pipePath, i):
        global xxLock, xxWaitList, PIPE_BUFSIZE
        socPath = pipePath.format(i)
        with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as prep:
            prep.connect(socPath)
            print(" -- [ PRED ] Connected to", i, "th preprocessor.")
            while True:
                try:
                    xx = pickle.loads(prep.recv(PIPE_BUFSIZE))
                    print(" -- [ PRED ] Received pickle...")
                    xxLock.acquire()
                    xxWaitList = np.concatenate((xxWaitList, xx), axis=0)
                    xxLock.release()
                except pickle.UnpicklingError:
                    print(" -- [ PRED ] Unpickling Error occured!")

    with Predictor(sleep=PRED_INTERVAL) as tp:
        for i in range(1, PREP_CNT + 1):
            th.Thread(target=procWindow, args=(PIPE_PATH, i)).start()
        tp.start()
        tp.join()
