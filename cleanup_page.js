const fs = require('fs');
const path = require('path');

const filePath = String.raw`d:\Projects\Logistics\web\backend-api\src\app\event\[id]\page.tsx`;

try {
    let content = fs.readFileSync(filePath, 'utf8');

    const startMarker = 'const BoothCard = ({';
    const endMarker = 'export default function EventDetailPageWrapper({';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
        console.error('Markers not found!');
        console.log('Start index:', startIndex);
        console.log('End index:', endIndex);
        process.exit(1);
    }

    const cleanBoothCard = `const BoothCard = ({
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
                <span className="text-xl font-bold text-[#004aad]">\${formatPrice(newPrice)}</span>
                <span className="text-sm text-gray-400 line-through ml-2">\${booth.price.toLocaleString()}</span>
             </div>
           ) : (
             <div className="text-xl font-bold text-[#004aad]">\${booth.price.toLocaleString()}</div>
           )}
           <button onClick={onBook} className="mt-4 w-full bg-[#004aad] text-white py-2 rounded-lg font-bold">
             Book Booth
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component Wrapper (Next.js route) ---
`;

    const newContent = content.substring(0, startIndex) + cleanBoothCard + content.substring(endIndex);

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('File successfully repaired.');

} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
