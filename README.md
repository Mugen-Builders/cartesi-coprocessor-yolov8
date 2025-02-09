<br>
<p align="center">
    <img src="https://github.com/Mugen-Builders/.github/assets/153661799/7ed08d4c-89f4-4bde-a635-0b332affbd5d" align="center" width="20%">
</p>
<br>
<div align="center">
    <i>EVM Linux Coprocessor as an Tree image detector</i>
</div>
<div align="center">
<b>Cartesi Coprocessor YOLOv8 model powered by EigenLayer cryptoeconomic security</b>
</div>
<br>
<p align="center">
	<img src="https://img.shields.io/github/license/henriquemarlon/coprocessor-tree-detector?style=default&logo=opensourceinitiative&logoColor=white&color=79F7FA" alt="license">
	<img src="https://img.shields.io/github/last-commit/henriquemarlon/coprocessor-tree-detector?style=default&logo=git&logoColor=white&color=868380" alt="last-commit">
</p>

##  Table of Contents

- [Prerequisites](#prerequisites)
- [Running](#running)
- [Demo](#demo)


###  Prerequisites

1. [Install Docker Desktop for your operating system](https://www.docker.com/products/docker-desktop/).

    To install Docker RISC-V support without using Docker Desktop, run the following command:
    
   ```shell
    docker run --privileged --rm tonistiigi/binfmt --install all
   ```

2. [Download and install the latest version of Node.js](https://nodejs.org/en/download).

3. Cartesi CLI is an easy-to-use tool to build and deploy your dApps. To install it, run:

```shell
npm i -g @cartesi/cli
```

###  Running

1. Start the devnet coprocessor infrastructure:

```bash

```

2. Build and Publish the application:

```sh
cartesi-coprocessor publish --network devnet
```

3. Deploy TreeDetector.sol and Token.sol contract:
   
```sh
make detector
```

> [!WARNING]
> Replace the argument `<token-contract-address>` with the deployed contract address shown in the previous output.

4. Deploy CoprocessorCallerMock contract:

```sh
forge create ./src/coprocessor/mock/CoprocessorCallerMock.sol:CoprocessorCallerMock \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 \
        --root ./contracts \
        --constructor-args 0x0000000000000000000000000000000000000000 \
                           0x0000000000000000000000000000000000000000000000000000000000000000
```

- Output example:
  
```sh
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployed to: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
Transaction hash: 0x9207bbfc5d041a5769f137705a6689054a9a0dedd1779a42a3d7505d90e22df1
```
