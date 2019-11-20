# 15na Server

Central server program of `15na`.

With running websocket server, `15na-server` receives CSI data from `15na-ap`, and classifies them.\
If fall is detected, this make alert at `15na-cli`.

### Requirements

#### Hardware
- Intel 5300 WLAN card `with CSI-Tool installation`

#### Software
- **MATLAB** R2015b+ <a href="#why-matlab"><sup>Really?</sup></a>
- **Python** 3.6+\
  dependency list in `requirements.txt`.
    - `tensorflow`
    - `numpy`
    - `matlab.engine`
- **Node.js** 12+\
  dependency list in `yarn.lock` and `package.json`.

### How to run

```bash
# Clone the repository
git clone https://github.com/widh/15na-server.git

# Run yarn or npm
cd 15na-server; yarn

# And look help
./15na help
```

### License

This project follows [Mozilla Public License 2.0](LICENSE.md#readme).

---
### Questions

###### Why MATLAB?
I understand MATLAB is slow and not usable in most environment, because of the license problem. So, in coming version, I'll remove MATLAB code and replace it to C++ or Julia or Python-based code. The exact language is not determined yet.

###### How about support Atheros CSITool?
Not planed yet.

###### Is this only for fall detection?
No.
