use anchor_lang::prelude::*;

declare_id!("EifYvJyprCavJ9WmCUXWprQxmBV23sjacqWBmAvJEUSi");

#[program]
pub mod myepicproject {
    use super::*;
    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> Result<()> {
        // アカウントへのリファレンスを取得
        let base_account = &mut ctx.accounts.base_account;
        // total_gifsを初期化
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // gif_linkとuser_addressを格納するための構造体を作成
        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
        };

        // gif_listにitemを追加
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }
}

/* StartStuffOffコンテキストに特定の変数をアタッチ */
#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    // initでは、Solanaにプログラムの新しいアカウントを作成するよう指示
    // payer = userでは、アカウントの利用料金を誰が支払うかをプログラム側に指示
    // space = 9000では、9000バイトのスペースがアカウントに割り当てる
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    // プログラムを呼び出したユーザーが、ウォレットアカウントを所有していることを証明する
    pub user: Signer<'info>,
    // Solanaを実行するプログラム｢SystemProgram｣への参照
    pub system_program: Program<'info, System>,
}

/* AddGif Contextに対して欲しいデータを指定 */
// BaseAccountに保存されているtotal_gifsの値を変更できるようにする
// AddGifメソッドを呼び出した署名者を構造体に追加し、保存できるようにする
#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

/* カスタム構造体を作成 */
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
}

/* 指定のアカウントに何を保存したいかをSolanaに伝える */
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    // ItemStruct型のVectorをアカウントにアタッチ
    pub gif_list: Vec<ItemStruct>,
}