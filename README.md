# Web NAS Manager

自宅NAS向けのWebファイルマネージャー。iPhone、iPad、Mac、PCのブラウザからファイル操作、写真プレビュー、メタデータ確認ができます。

Next.js + Dockerで構築。RAWファイルの高速プレビュー、EXIF/GPS表示、地図ビューなど、写真管理に特化した機能を搭載しています。

## 機能

### ファイル管理
- ディレクトリ閲覧（パンくずナビゲーション）
- ドラッグ&ドロップでアップロード（最大2GB）
- ストリーミングダウンロード（大容量ファイル対応）
- フォルダ作成、リネーム、削除
- リスト / グリッド / マップの3つの表示モード
- 名前 / サイズ / 日付でソート
- `Cmd+K`でファイル検索

### 写真・メディア
- **RAWサムネイル** — RAF, CR2/CR3, NEF, ARW, DNG, ORF, RW2, PEF対応（埋め込みJPEG抽出、1ファイル約100ms）
- **HEIC/TIFF**サムネイル変換（sharp使用）
- **Lightroom風画像プレビュー** — 右サイドバーにメタデータ、下部にサムネイルストリップ
- **EXIF表示** — カメラ、レンズ、焦点距離、シャッター速度、絞り、ISO
- **GPSマップビュー** — 写真の撮影位置を地図上にピン表示（マーカークラスタリング対応）
- **動画ストリーミング** — Range Request対応（MP4, MOV, MKV, WebM, AVI）

### 整理
- タグ — ファイルに自由にラベル付け
- お気に入り — 星アイコンでワンクリック登録
- サイドバーにお気に入り・タグセクション

### アプリ
- JWT認証（ブルートフォース対策付き）
- ダーク / ライト / システム連動テーマ
- PWA対応（ホーム画面に追加可能）
- iOS Safari最適化（Safe Area、タッチ操作、レスポンシブ）

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 画像処理 | sharp |
| EXIF解析 | exifr |
| 地図 | Leaflet + leaflet.markercluster |
| 認証 | jose + bcryptjs |
| コンテナ | Docker (node:20-alpine) |

## セットアップ

### 1. クローン & インストール

```bash
git clone https://github.com/sutobu000/web-nas-manager.git
cd web-nas-manager
pnpm install
```

### 2. ドライブを定義（drives.json）

サイドバーとトップページに表示する「ドライブ」を`drives.json`で定義します。サンプルをコピーして編集してください:

```bash
cp drives.example.json drives.json
```

```json
[
  { "id": "photos", "name": "Photos", "icon": "hdd", "description": "Main photo library" },
  { "id": "backup", "name": "Backup", "icon": "ssd" }
]
```

| フィールド | 必須 | 説明 |
|------------|------|------|
| `id` | 必須 | ドライブの識別子。マウント先`/data/<id>`とURL`/files/<id>`になる。使える文字は`a-z A-Z 0-9 . _ -`のみ |
| `name` | 必須 | UIに表示される名前 |
| `icon` | 任意 | `hdd` / `ssd`。それ以外の値や未指定はHDDアイコンで表示 |
| `description` | 任意 | 補足テキスト |

ドライブの数・名前・種別は自由です。行を増減するだけで変わります。

> **設定なしでも動きます。** `drives.json`が無い場合は、`/data`全体が1つのドライブとして表示されます。

### 3. 認証情報の設定

```bash
cp .env.example .env
```

`.env`を編集:

```env
JWT_SECRET=your-random-secret-here
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2b$10$your-bcrypt-hash
```

生成コマンド:

```bash
# JWT秘密鍵
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# パスワードハッシュ
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
```

### 4. ストレージのマウント

`docker-compose.yml`の`volumes`で、各ストレージを`/data/<id>`にマウントします（`<id>`は`drives.json`の`id`と一致させる）。行を増減して自分のドライブ構成に合わせてください:

```yaml
volumes:
  # <ホストのパス>:/data/<id>   （<id>はdrives.jsonのidと一致）
  - /mnt/photos:/data/photos       # Windowsなら例: - E:\photos:/data/photos
  - /mnt/backup:/data/backup
  # drives.json をマウント（UIのドライブ定義）
  - ./drives.json:/config/drives.json:ro
```

### 5. 起動

**ローカル開発:**

```bash
# next dev はプロジェクト直下の .env.local を読みます。
# 例（.env.local）:
#   DATA_ROOT=./dev-data            # テスト用ディレクトリを /data の代わりに参照
#   DRIVES_CONFIG_PATH=./drives.json # drives.json をプロジェクト直下から読む

pnpm dev
# http://localhost:3000
```

**Docker（本番）:**

```bash
docker compose up -d --build
# http://YOUR_NAS_IP:3000
```

## 環境変数一覧

| 変数 | 説明 | 必須 |
|------|------|------|
| `JWT_SECRET` | JWT署名用の秘密鍵 | 認証有効時 |
| `AUTH_USERNAME` | ログインユーザー名 | 認証有効時 |
| `AUTH_PASSWORD_HASH` | パスワードのbcryptハッシュ | 認証有効時 |
| `DRIVES_CONFIG_PATH` | `drives.json`の場所（既定: `/config/drives.json`） | 任意 |
| `STORAGE_DRIVES_JSON` | `drives.json`の代わりにJSON文字列で定義（ファイルより優先） | 任意 |
| `DATA_ROOT` | データルートの上書き（ローカル開発用） | 開発時 |
| `THUMBNAIL_CACHE_DIR` | サムネイルキャッシュの上書き | 任意 |

**`.env`での`$`エスケープについて:**
- Next.js（`.env.local`）: `\$`
- Docker Compose（`.env`）: `$$`

`JWT_SECRET`を設定しない場合、開発時（`NODE_ENV`が`production`以外）は認証がスキップされます。本番（`NODE_ENV=production`）では、未設定だと全リクエストを503で停止します（無認証のまま公開されるのを防ぐfail-close）。

## API一覧

| メソッド | エンドポイント | 説明 |
|----------|---------------|------|
| `GET` | `/api/drives` | ドライブ一覧 |
| `GET` | `/api/files?path=` | ディレクトリ一覧 |
| `DELETE` | `/api/files` | ファイル/フォルダ削除 |
| `POST` | `/api/files/upload` | アップロード（最大2GB） |
| `POST` | `/api/files/mkdir` | フォルダ作成 |
| `POST` | `/api/files/rename` | リネーム |
| `GET` | `/api/files/download?path=` | ダウンロード |
| `GET` | `/api/files/stream?path=` | 動画ストリーミング |
| `GET` | `/api/files/search?q=` | ファイル検索 |
| `GET` | `/api/files/metadata?path=` | EXIF/GPSメタデータ |
| `GET` | `/api/files/gps-scan?path=` | GPS写真スキャン |
| `GET/POST` | `/api/files/tags` | タグ・お気に入り |
| `GET` | `/api/thumbnail?path=` | サムネイル |
| `POST` | `/api/auth/login` | ログイン |
| `POST` | `/api/auth/logout` | ログアウト |
| `GET` | `/api/auth/session` | セッション確認 |

## キーボードショートカット

| ショートカット | 動作 |
|---------------|------|
| `Cmd+K` / `Ctrl+K` | 検索を開く |
| `i` | 情報パネルの切替（画像プレビュー中） |
| `←` `→` | 画像ナビゲーション（プレビュー中） |
| `Esc` | モーダル/検索を閉じる |

## セキュリティ

- 全APIでパストラバーサル対策済み
- ドライブ`id`は安全な文字種（`a-z0-9._-`）に制限（URL・パスに使われるため）
- アップロード上限: 2GB
- JWT認証（HttpOnly Cookie）
- ログインレート制限: 5回失敗で30秒ロック
- SVGはサムネイル生成対象外（XSS防止）

> **注意:** LAN内での利用を前提としています（CookieはHTTPアクセス想定で`secure`を無効化）。インターネットに公開する場合はHTTPS必須です。`JWT_SECRET`は本番で必須で、未設定のまま`NODE_ENV=production`で起動すると全リクエストを503で停止します（無認証公開を防ぐfail-close）。

## ライセンス

MIT License — 詳細は[LICENSE](./LICENSE)を参照してください。
