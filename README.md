# Lilium Coprocessor:

- CID -> https://w3s.link/ipfs/bafybeiamacve3gucm4id5vbplpe2mts4eoznx4kf2h3ode7x7hxxx6ou7i



```bash
forge create ./src/Token.sol:Token \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 \
        --root ./contracts \
        --constructor-args "CARBON" "CBN"
```

```bash
forge create ./src/coprocessor/mock/CoprocessorCallerMock.sol:CoprocessorCallerMock \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 \
        --root ./contracts \
        --constructor-args 0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e 0x59b22D57D4f067708AB0c00552767405926dc768 0x0000000000000000000000000000000000000000 0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712
```