import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from 'react';
import './App.css';
import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Program, AnchorProvider, web3 } from '@project-serum/anchor'
import kp from './Keypair.json'

require('dotenv').config()

/* 定数を宣言 */
const TWITTER_HANDLE = 'akihidesuyo1130';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const TEST_GIFS = [
//   'https://media.giphy.com/media/hpd3cl2aem3LFffoB9/giphy.gif',
//   'https://media.giphy.com/media/LeGnsKiiTcYMl05PCU/giphy.gif',
//   'https://media.giphy.com/media/oqzeU1H54fpei34PfV/giphy.gif',
//   'https://media.giphy.com/media/vD8cajJNMajDYVIWXJ/giphy.gif'
// ]

// SystemProgramはSolanaランタイムへの参照
const { SystemProgram, Keypair } = web3

// GIFデータを保持するアカウントのキーペアを作成
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// IDLファイルからプログラムIDを取得
const programID = new PublicKey(idl.metadata.address)

// ネットワークをDevnetに設定
const network = clusterApiUrl(process.env.SOLANA_NETWORK)

// トランザクションが完了したときに通知方法を制御
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  //　ユーザーのウォレットアドレスのstateを管理するためuseState
  const [walletAddress, serWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])

  /* Phantom Walletが接続されているかどうかを確認するための関数 */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!")

          /* ユーザーのウォレットに直接接続する機能を提供 */
          const response = await solana.connect({ onlyIfTrusted: true })
          console.log(
            "Connected with Public Key: ",
            response.publicKey.toString()
          )

          // walletAddressにユーザーのウォレットアドレスのstateを更新
          serWalletAddress(response.publicKey.toString())
        }
      }
      else {
        alert("Phantom object not found! Get a Phantom wallet 👻")
      }
    }
    catch(error) {
      console.log(error)
    }
  }

  /* 「Connect to Wallet」ボタンを押したときに動作する関数 */
  const connectWallet = async () => {
    const { solana } = window

    if (solana) {
      const response = await solana.connect()
      console.log("Connected with Public Key: ", response.publicKey.toString())
      serWalletAddress(response.publicKey.toString())
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    )

    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      console.log("ping")

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })

      console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString())
      await getGifList()
    }
    catch(err) {
      console.log("Error creating BaseAccount account:", err)
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('')
    console.log("Gif link: ", inputValue)
    
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      })

      console.log("GIF successfully sent to program", inputValue)

      await getGifList()
    }
    catch(err) {
      console.log("Error sending GIF: ", err)
    }
  }

  /* ユーザーがWebアプリケーションをウォレットに接続していないときに表示するUI */
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to wallet
    </button>
  )

  const renderConnectedContainer = () => {
    // プログラムアカウントが初期化されているかどうかチェック
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    // アカウントが存在した場合、ユーザーはGIFを投稿することができる
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendGif()
            }}
          >
            <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange} />
            <button type="submit" className='cta-button submit-gif-button'>Submit</button>
          </form>

          <div className="gif-grid">
            {/* indexをキーとして使用し、GIFイメージとしてitem.gifLinkに変更 */}
            {gifList.map((item, index) => (
              <div className='gif-item' key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  /* 初回のレンダリング時にのみ、Phantom Walletが接続されているかどうか確認 */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  const getGifList = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log("Got the account", account)
      setGifList(account.gifList)
    }
    catch(err) {
      console.log("Error in getGifList: ", err)
      setGifList(null)
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...")

      // TEST_GIFSをgifListに設定
      getGifList()
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection ✨
          </p>
          {/* ウォレットアドレスを持っていない場合にのみ表示 */}
          {!walletAddress && renderNotConnectedContainer()}
        </div>

        <main className='main'>
          {/* ウォレットが接続されている場合にrenderConnectedContainer関数を実行 */}
          {walletAddress && renderConnectedContainer()}
        </main>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;