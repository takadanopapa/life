source "https://rubygems.org"

# Jekyll 本体（Ruby 3.4 対応の 4.x 系）
gem "jekyll", "~> 4.4"

# 使用プラグイン
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Ruby 3.4 で標準gemから分離されたもの（ビルド環境向けに明示）
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"

# タイムゾーンデータ（Windows等でローカルプレビューする場合用）
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]
