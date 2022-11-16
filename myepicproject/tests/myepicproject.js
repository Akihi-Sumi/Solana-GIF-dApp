const anchor = require('@project-serum/anchor')

// 以下の処理に必要なSystemProgramモジュールを用意
const { SystemProgram } = anchor.web3

const main = async () => {
  console.log("🚀 Starting test...")

  // solana config getからAnchorにプロバイダーを設定するように指示
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  // lib.rsでコードを自動的にコンパイルし、ローカル上のバリデータがデプロイされる
  const program = anchor.workspace.Myepicproject

  // プログラムが使用するアカウントのキーペアを作成
  const baseAccount = anchor.web3.Keypair.generate()

  // // start_stuff_off を呼び出し、必要なパラメータを渡す
  // ローカル上のバリデータが命令を「マイニング」するのを待つ
  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  })

  console.log("📝 Your transaction signature", tx)

  // アカウントからデータを取得
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey)
  console.log("👀 GIF Count", account.totalGifs.toString())

  // add_gif関数を呼び出し、GIFリンクと送信ユーザーのアドレスを渡す
  await program.rpc.addGif("https://media.giphy.com/media/vD8cajJNMajDYVIWXJ/giphy.gif", {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  })

  // 再びアカウントを取得してtotal_gifsを確認
  account = await program.account.baseAccount.fetch(baseAccount.publicKey)
  console.log('👀 GIF Count', account.totalGifs.toString())

  // アカウントでgif_listにアクセス
  console.log("👀 GIF List", account.gifList)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  }
  catch(err) {
    console.error(err)
    process.exit(1)
  }
}

runMain()