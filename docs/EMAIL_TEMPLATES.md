# Supabase Auth Email 模板（繁體中文）

> **前置條件**：Supabase 已將模板編輯鎖在自訂 SMTP 之後（Dashboard → Authentication → Emails 會顯示「Set up custom SMTP to edit templates」）。
> 需先到 Project Settings → Authentication → SMTP Settings 啟用自訂 SMTP（正式環境建議 Resend + 自有網域；開發期可用 Gmail 應用程式密碼過渡），之後即可貼上以下模板。
>
> 可用變數：`{{ .ConfirmationURL }}`（動作連結）、`{{ .Email }}`（收件者）、`{{ .SiteURL }}`。
> 按鈕色為品牌色 Periwinkle `#c0b9dd` 配深字 `#2a2d3e`；信件底色維持白色（email 客戶端對深色主題支援差）。

## Confirm signup（註冊驗證信）

**Subject**：`驗證你的 Cash Commitment Tracker 帳號`

```html
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #2a2d3e;">歡迎加入 Cash Commitment Tracker 🎉</h2>
  <p style="color: #4b5563;">感謝你的註冊！請點擊下方按鈕驗證你的電子郵件，完成帳號啟用：</p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #c0b9dd; color: #2a2d3e; text-decoration: none; border-radius: 12px; font-weight: bold;"
  >
    驗證電子郵件
  </a>
  <p style="color: #9ca3af; font-size: 13px;">
    按鈕無法點擊的話，請複製此連結到瀏覽器開啟：<br />
    <a href="{{ .ConfirmationURL }}" style="color: #80a1d4; word-break: break-all;"
      >{{ .ConfirmationURL }}</a
    >
  </p>
  <p style="color: #9ca3af; font-size: 13px;">如果這不是你本人的操作，請忽略這封信。</p>
</div>
```

## Reset password（重設密碼信）

**Subject**：`重設你的密碼`

```html
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #2a2d3e;">重設密碼</h2>
  <p style="color: #4b5563;">我們收到了你的密碼重設申請。請點擊下方按鈕設定新密碼：</p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #c0b9dd; color: #2a2d3e; text-decoration: none; border-radius: 12px; font-weight: bold;"
  >
    設定新密碼
  </a>
  <p style="color: #9ca3af; font-size: 13px;">
    按鈕無法點擊的話，請複製此連結到瀏覽器開啟：<br />
    <a href="{{ .ConfirmationURL }}" style="color: #80a1d4; word-break: break-all;"
      >{{ .ConfirmationURL }}</a
    >
  </p>
  <p style="color: #9ca3af; font-size: 13px;">
    如果這不是你本人的申請，請忽略這封信，你的密碼不會被變更。
  </p>
</div>
```
