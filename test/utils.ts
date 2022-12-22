import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";

async function sendEther(
    _signerFrom: Signer,
    _signerTo: Signer,
    etherNum: number
) {
    const tx = {
        from: await _signerFrom.getAddress(),
        to: await _signerTo.getAddress(),
        value: etherNum,
        gasPrice: 250000000000,
        gasLimit: 1001000,
    };
    const receipt = await _signerFrom.sendTransaction(tx);
    await receipt.wait();
}

export { sendEther };
