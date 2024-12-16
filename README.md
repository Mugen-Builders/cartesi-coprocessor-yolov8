<br>
<p align="center">
    <img src="https://github.com/user-attachments/assets/fa8ca0d5-d826-445e-8fec-edb2fa4a4d75" align="center" width="20%">
</p>
<br>
<div align="center">
    <i>Driving sustainability with blockchain, IoT, and AI for verified carbon credits.</i>
</div>
<div align="center">
<b>YOLOv8 running within a RISC-V VM (e.g., the Cartesi Machine) as a Cartesi Coprocessor</b>
</div>
<br>
<p align="center">
	<img src="https://img.shields.io/github/license/henriquemarlon/lilium-coprocessor?style=default&logo=opensourceinitiative&logoColor=white&color=88E818" alt="license">
	<img src="https://img.shields.io/github/last-commit/henriquemarlon/lilium-coprocessor?style=default&logo=git&logoColor=white&color=868380" alt="last-commit">
</p>

##  Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running](#running)
  - [Links](#links)
  - [Testing](#testing)

##  Getting Started

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
   
4. [Download and Install the latest version of Golang.](https://go.dev/doc/install)

5. Install development node ( Nonodo ):
```shell
    npm i -g nonodo
```

###  Running

1. Build application:

```sh
cartesi build
```

2. Start nonodo:

```sh
nonodo
```

3. Run the Cartesi Machine:

```sh
cartesi-machine --network --flash-drive=label:root,filename:.cartesi/image.ext2 \
                --volume=.:/mnt --env=ROLLUP_HTTP_SERVER_URL=http://10.0.2.2:5004 \
                --workdir=/mnt -- python dapp.py
```

4. Deploy Token contract:
   
```sh
forge create ./src/Token.sol:Token \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 \
        --root ./contracts \
        --constructor-args "CARBON" "CBN"
```

- Output example:
  
```sh
No files changed, compilation skipped
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployed to: 0x59b670e9fA9D0A427751Af201D676719a970857b
Transaction hash: 0xdf69c83afff3cf2ad249dca4f69e3f002a5ba185f0558ebd5daecdd8cc7c3fee
```

> [!CAUTION]
> Replace the argument `<token-contract-address>` with the deployed contract address shown in the previous output.

5. Deploy CoprocessorCallerMock contract:

```sh
forge create ./src/coprocessor/mock/CoprocessorCallerMock.sol:CoprocessorCallerMock \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 \
        --root ./contracts \
        --constructor-args 0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e \
                           0x59b22D57D4f067708AB0c00552767405926dc768 \
                           0x0000000000000000000000000000000000000000 \
                           0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712
```

- Output example:
  
```sh
No files changed, compilation skipped
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployed to: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
Transaction hash: 0x24390d20b76f1528a2da4fb8c7cae324399bbe7fb28f911db646024b735b6ef0
```

> [!WARNING]
> Before proceeding with the next steps, copy the address of the CoprocessorCallerMock contract shown in the last output and follow the instructions provided [here](https://github.com/henriquemarlon/coprocessor-local-development). 

6. Load `INPUT_EXAMPLE.txt` as a env variable and export it:

```sh
export INPUT=$(source INPUT_EXAMPLE.txt; echo -n "$REAL_WORLD_DATA" | xxd -p | tr -d '\n' | sed 's/^/0x/')
```

7. Send input:

```sh
cartesi send generic --input=$INPUT --chain-id=31337 --rpc-url=http://localhost:8545 \
                     --dapp=0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e --mnemonic-index=0 \
                     --mnemonic-passphrase="test test test test test test test test test test test junk"
                     
```

### Testing

1. Contracts:

```sh
forge test --root ./contracts
```

### Links

- CID -> https://w3s.link/ipfs/bafybeiamacve3gucm4id5vbplpe2mts4eoznx4kf2h3ode7x7hxxx6ou7i
