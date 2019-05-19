# 15na Server

Central server program of `15na`.\
This receives CSI data from `15na-ap`, calibrates them, and classifies them.\
Multiprocessing on two or more machines over network supported on prediction(classification) stage.

### Requirements

- MATLAB 2015+
- Python 3.6
    - `keras` or `keras-gpu` with `tensorflow` backend.
    - `numpy`
    - `matlab.engine`
- Node.js 10.x with `yarn`

### How to run

```bash
$ git clone https://github.com/widh/15na-server.git
$ cd 15na-server; yarn
$ # And see this
$ yarn start -- help
```

### License

MPL 2.0
