$path = "d:\Projects\Logistics\web\backend-api\src\app\event\[id]\page.tsx"
$content = Get-Content $path -Raw

$startMarker = "const BoothCard = ({"
$endMarker = "// --- Main Page Component Wrapper (Next.js route) ---"

$startIndex = $content.IndexOf($startMarker)
$endIndex = $content.IndexOf($endMarker)

if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
    $preParams = $content.Substring(0, $startIndex)
    $postParams = $content.Substring($endIndex)
    
    $cleanBoothCard = @"
const BoothCard = ({
  booth,
  offerPercent,
  offerName,
  onBook,
}: {
  booth: Booth;
  offerPercent?: number | null;
  offerName?: string | null;
  onBook: () => void;
}) => {
  const discounted = !!offerPercent && offerPercent > 0;
  const newPrice = getDiscountedPrice(booth.price, offerPercent);

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      {discounted && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {Math.round(offerPercent!)}% OFF
        </div>
      )}
      <div className="relative h-48 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <span className="text-lg font-semibold">Booth Preview</span>
        </div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <h4 className="text-lg font-bold text-gray-800 mb-2">{booth.name}</h4>
        <div className="mt-auto">
           {discounted ? (
             <div>
                <span className="text-xl font-bold text-[#004aad]">${formatPrice(newPrice)}</span>
                <span className="text-sm text-gray-400 line-through ml-2">${booth.price.toLocaleString()}</span>
             </div>
           ) : (
             <div className="text-xl font-bold text-[#004aad]">${booth.price.toLocaleString()}</div>
           )}
           <button onClick={onBook} className="mt-4 w-full bg-[#004aad] text-white py-2 rounded-lg font-bold">
             Book Booth
           </button>
        </div>
      </div>
    </div>
  );
};

"@
    
    $newContent = $preParams + $cleanBoothCard + $postParams
    Set-Content -Path $path -Value $newContent -NoNewline
    Write-Host "File fixed successfully."
} else {
    Write-Error "Markers not found or in wrong order."
}
