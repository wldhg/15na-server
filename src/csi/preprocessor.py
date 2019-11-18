# IRONA Server is subject to the terms of the Mozilla Public License 2.0.
# You can obtain a copy of MPL at LICENSE.md of repository root.

import sys
import numpy as np
import matlab.engine as meng
import socket as soc
import pickle
import threading as th
import atexit
import signal
import os
import json

# Config MATLAB
ml = meng.start_matlab()
ml.addpath('./src/csi')
ml.addpath('./src/csi/tools')

# Constants
[
  PROCESS_CMD,
  PP_ID_TEMPLATE,
  PP_ID_STR,
  PREP_SOC,
  PIPE_TEMPLATE,
  CSI_REDUCE_RESOLUTION_STR,
  CSI_WINSLIDEROW_STR,
  CSI_WINROW_STR,
  CSI_WINCOL_STR,
  CSI_WINCOL_PER_PAIR_STR,
  CSI_TX_STR,
  CSI_RX_STR,
  CSI_PROCAMP_STR,
  CSI_PROCPHASE_STR,
  CSI_PPS_STR,
  LEAVE_DAT_STR
] = sys.argv
PP_ID = PP_ID_TEMPLATE.format(int(PP_ID_STR))
PIPE_SOC = PIPE_TEMPLATE.format(int(PP_ID_STR))
CSI_REDUCE_RESOLUTION = int(CSI_REDUCE_RESOLUTION_STR)
CSI_WINSLIDEROW = int(CSI_WINSLIDEROW_STR)
CSI_WINROW = int(CSI_WINROW_STR)
CSI_WINCOL = int(CSI_WINCOL_STR)
CSI_WINCOL_PER_PAIR = int(CSI_WINCOL_PER_PAIR_STR)
CSI_PROCAMP = CSI_PROCAMP_STR == 'true'
CSI_PROCPHASE = CSI_PROCPHASE_STR == 'true'
CSI_PPS = int(CSI_PPS_STR)
DEL_DAT = LEAVE_DAT_STR == 'false'

# Set Print
logPrefix = "\033[0;35;40m>> [PREP - " + PP_ID + "]\033[0m"
def log(*args):
  print(logPrefix, " ".join(tuple(map(str,args))))

# Open IPC Client to Node
stoppie = False
with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as node:
  node.connect(PREP_SOC)
  with soc.socket(soc.AF_UNIX, soc.SOCK_STREAM) as pipe:
    pipe.bind(PIPE_SOC)
    pipe.listen(1)

    def closePipe(placeholder1=None, placeholder2=None):
      stoppie = True
      try:
        os.unlink(PIPE_SOC)
        pipe.close()
      except:
        pass

    atexit.register(closePipe)
    signal.signal(signal.SIGINT, closePipe)
    signal.signal(signal.SIGTERM, closePipe)

    def preprocess(pred, addr):
      global node
      global PP_ID, CSI_REDUCE_RESOLUTION, CSI_WINSLIDEROW, CSI_WINROW, CSI_WINCOL, CSI_WINCOL_PER_PAIR, CSI_TX_STR, CSI_RX_STR
      log("Connected to Predictor! Wait for new data...")
      while True:
        req = json.loads(node.recv(256).decode('utf-8'))
        datPath = req["path"]

        # Read Datfile
        log("RAW Data received. Preprocessing...")
        cat = np.asarray(ml.preprocess(datPath, PP_ID, CSI_REDUCE_RESOLUTION, CSI_PPS,  CSI_PROCAMP, CSI_PROCPHASE, CSI_WINCOL_PER_PAIR, CSI_TX_STR, CSI_RX_STR))

        # Delete Datfile
        if DEL_DAT:
          os.remove(datPath)

        # Get Windows without timestamp
        log("Applying sliding window...")
        newList = np.empty([0, CSI_WINROW, CSI_WINCOL], float)
        while True:
          if len(cat) < CSI_WINROW:
            break
          else:
            window = np.dstack(cat[0:CSI_WINROW, :].T)
            newList = np.concatenate((newList, window), axis=0)
            cat = cat[CSI_WINSLIDEROW:, :]

        # Get Scores
        log("Dumping windows to predictor...")
        dumpedList = pickle.dumps(tuple((str(req["aid"]), newList)))
        log("Windows dumped.", "Length:", len(dumpedList))
        pred.sendall(dumpedList)
        pred.sendall("ｅｔｅｒｎｉｔｙ＿ＴａｋｅＭｙＨａｎｄ".encode("utf-8"))
        log("Windows sent. Wait for new data...")

    while True:
      try:
        acceptedPipe = pipe.accept()
        th.Thread(target=preprocess, args=acceptedPipe).start()
      except:
        pass
