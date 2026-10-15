import type { ReactElement } from "react";

// Versi original raw export dari Figma (untuk arsip referensi jika diperlukan)
export const FigmaExportRaw = (): ReactElement => {
  return (
    <main className="relative h-[1080px] w-[1280px] overflow-hidden overflow-y-scroll bg-[#2f4156]">
      <div className="absolute bottom-[-133px] left-[-7px] h-[1080px] w-[calc(100%_+_7px)] bg-[#2f4156]">
        <div className="absolute left-[calc(50.00%_-_76px)] top-[470px] flex h-3.5 w-[154px] items-center justify-center whitespace-nowrap text-center [font-family:'Inter-Regular',Helvetica] text-[15px] font-normal leading-[normal] tracking-[0] text-white">
          ORALYTIC
        </div>
        <p className="absolute left-[calc(50.00%_-_148px)] top-[490px] h-[93px] w-[297px] text-center [font-family:'Inter-Regular',Helvetica] text-xs font-normal leading-[normal] tracking-[0] text-white">
          Skrininig risiko stunting melalui analisis
          <br />
          kesehatan rongga mulut.
        </p>
      </div>
      <div className="absolute left-[calc(50.00%_-_101px)] top-[calc(50.00%_-_176px)] h-[246px] w-[197px] flex items-center justify-center">
        <span className="text-4xl font-bold tracking-widest text-teal-300">ORALYTIC</span>
      </div>
    </main>
  );
};
