source "https://rubygems.org"

# GitHub Pages 互換でビルドするためのメタgem。
# ローカルでプレビューしたい時だけ使います（Rubyが必要）。
# GitHub 上での公開には Ruby のローカルインストールは不要です。
gem "github-pages", group: :jekyll_plugins

# Windows / JRuby 向けの補助gem
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
