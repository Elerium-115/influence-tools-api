/**
 * Mapping each Starknet address to that player's
 * Discord name, if they explicitly agree to this.
 * 
 * NOTE: The address keys must be lowercase!
 */
const playerByAddress: {[key: string]: string} = {
    '0x0795a0690f51905f34f2d52b482e18ebc39b87638e30eb4bd4fc65ff67a7beec': 'Unstoppable Games',
    '0x048242eca329a05af1909fa79cb1f9a4275ff89b987d405ec7de08f73b85588f': 'Unstoppable Games',
    '0x02f7fe3689845c3ebb064f973c4d2978b4cbca5adc78b82bb3be9fb1edbef3af': 'protoplanetary',
    '0x0750c9945938b4c89baf68acc9a97d52d59eeef6b399c57edc75c8127a70f050': '<Q> Ciefa',
    '0x02ac310971056cf7ee6f6f27e5f91a551df5f12b215b0972045b486d43c47b38': '<Q> Daharius', // primary address
    '0x06f9aebffaaeb5df2ad943ee7b639d5431f0af2c603b7622c1d6d402bd92dbf6': '<Q> Daharius', // secondary address
    '0x02fd7308ef5321c18475e93e8387a0ca960db68307d1e2afe4ed09085acda7c6': '<Q> Elerium115',
    '0x059a67b550ac4543a0afddf2fe4e20f0e54d498e4b9f701f527ae22e32e36561': '[1ST] Cheveuxxx｜floodgate.space',
    '0x0708804F54d45C40b4C81921Cd308b4f058c36679ddbd6C03EaaDF190230ca8F': '[1ST] DrJones | Tyrell-Yutani',
    '0x054e1c559aaea40281c40d610d203cf7b65231ee9f68a26fcddf73c5d6988cc4': '[1ST] f-r-e-d',
    '0x03395f326d463f068a94b0312ec4275757ce152f2abbe2cc17eeb5173b43bc38': '[1ST] I.P_address',
    '0x0208ae30370a43236e03c6b72b4c9cf14bcd11c3dbe89020967df0bd649438ae': '[1ST] k3n_n3k | (^-^) ノ',
    '0x019f0f563f9468e1995cc55fec8dfddfc30bb667ce4b020a6c8b7d9aa412aa06': '[1ST] NeilKD',
    '0x013fb68a3fd7b98e32397f9d2dc5214bb14f7ffb9717b20485c6200c6dfea906': '[1ST] ProfessorSabre',
    '0x0631acdbf5a79758cbcc84301b387aebfb5c0ec7476aa48a0ceb98662973c5ce': '[1ST] Skippy The Magnificent',
    '0x0614872dd2f3324f3e9a047d0cfaab9e9573bbdfa6081877f49f7108116b8ae0': '[SG] Gnarly Narwhal',
    '0x0290217ee1b05debca3a34103dbaa479a72c102e14197ed8e3adf7eebc0437ad': '[SG] partiallyZen',
};

export {
    playerByAddress,
}
