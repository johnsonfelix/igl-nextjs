$oldGreen = "#5da765"
$newBlue = "#004aad"
$oldBlue = "#2946f3"
$newGreen = "#2ebb79"

Get-ChildItem -Path "src" -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace $oldGreen, $newBlue -replace $oldBlue, $newGreen
    if ($content -ne $newContent) {
        Set-Content $_.FullName $newContent -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}
