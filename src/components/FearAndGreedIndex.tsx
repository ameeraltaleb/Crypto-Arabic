import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface FngData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export default function FearAndGreedIndex() {
  const [data, setData] = useState<FngData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFng = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          setData(json.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch Fear and Greed index', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFng();
    // Refresh every hour
    const interval = setInterval(fetchFng, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-gray-200 dark:border-gray-800/60 shadow-xl animate-pulse transition-colors duration-300">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-full w-32 mx-auto"></div>
      </div>
    );
  }

  if (!data) return null;

  const value = parseInt(data.value, 10);
  
  // Determine color and icon based on value
  let colorClass = 'text-gray-500 dark:text-gray-400';
  let bgClass = 'bg-gray-100 dark:bg-gray-800';
  let Icon = AlertTriangle;

  if (value <= 25) {
    colorClass = 'text-red-500';
    bgClass = 'bg-red-500/10';
    Icon = TrendingDown;
  } else if (value <= 45) {
    colorClass = 'text-orange-500';
    bgClass = 'bg-orange-500/10';
    Icon = TrendingDown;
  } else if (value <= 55) {
    colorClass = 'text-yellow-500';
    bgClass = 'bg-yellow-500/10';
    Icon = AlertTriangle;
  } else if (value <= 75) {
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-400/10';
    Icon = TrendingUp;
  } else {
    colorClass = 'text-yellow-500';
    bgClass = 'bg-yellow-500/10';
    Icon = TrendingUp;
  }

  // Calculate rotation for the gauge needle (0 to 180 degrees)
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-[2rem] p-6 lg:p-8 border border-gray-200 dark:border-gray-800/60 shadow-xl h-full flex flex-col transition-colors duration-300">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded-xl">
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        مؤشر الخوف والطمع
      </h3>
      
      <div className="relative flex flex-col items-center justify-center py-4 flex-grow">
        {/* Gauge Background */}
        <div className="relative w-48 h-24 overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-gray-200 dark:border-gray-800 border-b-transparent border-r-transparent rotate-45 transition-colors duration-300"></div>
          {/* Gradient overlay for gauge */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-transparent border-t-red-500 border-l-yellow-500 border-b-yellow-500 border-r-yellow-400 rotate-45 opacity-20 mix-blend-screen"></div>
          
          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 w-1 h-20 bg-yellow-500 origin-bottom rounded-t-full transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
            <div className="absolute -bottom-2 -left-1.5 w-4 h-4 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/40"></div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className={`text-5xl font-black ${colorClass} mb-1 tracking-tighter`}>
            {value}
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-bold text-xl mb-2">
            {data.value_classification === 'Extreme Fear' && 'خوف شديد'}
            {data.value_classification === 'Fear' && 'خوف'}
            {data.value_classification === 'Neutral' && 'محايد'}
            {data.value_classification === 'Greed' && 'طمع'}
            {data.value_classification === 'Extreme Greed' && 'طمع شديد'}
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
        <div className="flex items-start gap-2.5 text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-yellow-500" />
          <p className="text-[10px] leading-relaxed">
            مؤشر مباشر يعكس نفسية المتداولين. الخوف الشديد قد يكون فرصة شراء، والطمع الشديد قد ينذر بتصحيح.
          </p>
        </div>
      </div>
    </div>
  );
}
