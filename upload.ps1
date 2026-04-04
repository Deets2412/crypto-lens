$VerbosePreference = "Continue"
$ftpUrl = "ftp://gsydm1057.siteground.biz/public_html/"
$username = "deploy@coindebrief.com"
$password = "deploy_admin_24"
$localDir = "c:\Users\61410\New AntiGravity Project - Crypto\crypto-lens\out"

Function Upload-FtpDirectory {
    param($dir, $ftpUrl)
    Write-Host "Scanning $dir"
    $items = Get-ChildItem -Path $dir
    foreach ($item in $items) {
        $ftpPath = $ftpUrl + $item.Name
        if ($item.PSIsContainer) {
            Write-Host "Creating directory $ftpPath"
            try {
                $req = [System.Net.WebRequest]::Create($ftpPath)
                $req.Credentials = New-Object System.Net.NetworkCredential($username, $password)
                $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                $res = $req.GetResponse()
                $res.Close()
            } catch { 
                Write-Host "Directory might exist or error: $($_.Exception.Message)"
            }
            # recursive call
            Upload-FtpDirectory -dir $item.FullName -ftpUrl ($ftpPath + '/')
        } else {
            Write-Host "Uploading $($item.Name)"
            try {
                $webclient = New-Object System.Net.WebClient
                $webclient.Credentials = New-Object System.Net.NetworkCredential($username, $password)
                $webclient.UploadFile($ftpPath, $item.FullName)
            } catch {
                Write-Host "Failed to upload $($item.Name): $($_.Exception.Message)"
            }
        }
    }
}

Write-Host "Starting FTP Upload..."
Upload-FtpDirectory -dir $localDir -ftpUrl $ftpUrl
Write-Host "FTP Upload Complete!"
