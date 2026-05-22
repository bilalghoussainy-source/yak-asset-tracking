# Makes near-black pixels transparent. Output: public/span-logo-tagline.png
param(
  [string]$Source,
  [string]$Out,
  [int]$Threshold = 48
)
Add-Type -AssemblyName System.Drawing
$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
$bmp = New-Object System.Drawing.Bitmap $srcImg.Width, $srcImg.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($srcImg, 0, 0, $srcImg.Width, $srcImg.Height)
$g.Dispose()
$srcImg.Dispose()

for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $p = $bmp.GetPixel($x, $y)
    if ($p.R -le $Threshold -and $p.G -le $Threshold -and $p.B -le $Threshold) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
    }
  }
}

$dir = Split-Path $Out -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Wrote $Out"
