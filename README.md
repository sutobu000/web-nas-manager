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

### 2. 環境変数の設定

```bash
# Docker運用（本番）はプロジェクト直下の .env にコピー
cp .env.example .env
```

`.env`を編集（変数名は docker-compose.yml と対応します。ローカルで `next dev` する場合は同じ内容を `.env.local` に置きます）:

```env
# ストレージのパス（Windowsはドライブレター、Linux/Macは /mnt/... や /Volumes/...）
# 既定は4ドライブ分。数は自分の環境に合わせて増減できます
HDD_001_PATH=E:\
HDD_002_PATH=F:\
SSD_001_PATH=G:\
SSD_002_PATH=H:\

# 認証情報
JWT_SECRET=your-random-secret-here
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2b$10$your-bcrypt-hash
```

認証情報の生成:

```bash
# JWT秘密鍵
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# パスワードハッシュ
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
```

### 3. ドライブの設定

既定で4ドライブ（`HDD-001` `HDD-002` `SSD-001` `SSD-002`）が定義済みです。変更する場合は`src/lib/constants.ts`の`STORAGE_DRIVES`を編集:

```typescript
export const STORAGE_DRIVES: StorageDrive[] = [
  {
    id: "HDD-001",         // docker-compose.ymlのマウント先 /data/<id> と一致させる
    name: "HDD-001",       // サイドバーに表示される名前
    path: "/data/HDD-001",
    description: "Main HDD",
    icon: "hdd",           // "hdd" または "ssd"
  },
  // HDD-002 / SSD-001 / SSD-002 と続く。必要に応じて追加・削除...
];
```

`docker-compose.yml`のvolumesは`.env`の変数を参照します（既定のまま使えます）:

```yaml
volumes:
  # 形式: <ホストパス>:/data/<ドライブID>（IDはSTORAGE_DRIVESのidと一致）
  # ホストパスは .env の HDD_001_PATH 等で指定（未設定ならE:\等にフォールバック）
  - ${HDD_001_PATH:-E:\}:/data/HDD-001
  - ${HDD_002_PATH:-F:\}:/data/HDD-002
  - ${SSD_001_PATH:-G:\}:/data/SSD-001
  - ${SSD_002_PATH:-H:\}:/data/SSD-002
```

### 4. 起動

**ローカル開発:**

```bash
# .env.local に DATA_ROOT を設定（テスト用ディレクトリ。/data の代わりに参照される）
# 例: DATA_ROOT=./dev-data

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
| `HDD_001_PATH` | `/data/HDD-001` にマウントするホストパス | Docker時 |
| `HDD_002_PATH` | `/data/HDD-002` にマウントするホストパス | Docker時 |
| `SSD_001_PATH` | `/data/SSD-001` にマウントするホストパス | Docker時 |
| `SSD_002_PATH` | `/data/SSD-002` にマウントするホストパス | Docker時 |
| `JWT_SECRET` | JWT署名用の秘密鍵 | 認証有効時 |
| `AUTH_USERNAME` | ログインユーザー名 | 認証有効時 |
| `AUTH_PASSWORD_HASH` | パスワードのbcryptハッシュ | 認証有効時 |
| `DATA_ROOT` | データルートの上書き（ローカル開発用） | 開発時 |
| `THUMBNAIL_CACHE_DIR` | サムネイルキャッシュの上書き | 任意 |

**`.env`での`$`エスケープについて:**
- Next.js（`.env.local`）: `\$`
- Docker Compose（`.env`）: `$$`

`JWT_SECRET`を設定しなければ認証はスキップされます（開発用）。

## API一覧

| メソッド | エンドポイント | 説明 |
|----------|---------------|------|
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
- アップロード上限: 2GB
- JWT認証（HttpOnly Cookie）
- ログインレート制限: 5回失敗で30秒ロック
- SVGはサムネイル生成対象外（XSS防止）

> **注意:** LAN内での利用を前提としています（CookieはHTTPアクセス想定で`secure`を無効化）。インターネットに公開する場合はHTTPS必須です。また`JWT_SECRET`を設定しないと認証がスキップされ、誰でもアクセスできてしまうため、本番では必ず設定してください。

## ライセンス

MIT License — 詳細は[LICENSE](./LICENSE)を参照してください。
