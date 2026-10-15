
import React, { useEffect, useMemo, useState } from 'react';
import type { PatientData, StuntingScreeningData, ScreeningRecord } from '../types';
import InfoTooltip from './InfoTooltip';
import { useLanguage } from '../contexts/LanguageContext';
import { initialStuntingData } from '../App';
import PatientHistoryChart from './PatientHistoryChart';


interface StuntingScreeningProps {
  patientData: PatientData;
  stuntingData: StuntingScreeningData;
  onPatientDataChange: (data: PatientData) => void;
  onStuntingDataChange: (data: StuntingScreeningData) => void;
  records: ScreeningRecord[];
}

const proteinSources = [
    { value: 'Fish', labelKey: 'proteinFish' }, { value: 'Chicken', labelKey: 'proteinChicken' },
    { value: 'Eggs', labelKey: 'proteinEggs' }, { value: 'Tofu/Tempeh', labelKey: 'proteinTofuTempeh' },
    { value: 'Meat', labelKey: 'proteinMeat' }, { value: 'Dairy', labelKey: 'proteinDairy' },
];
const carbSources024 = [
    { value: 'Rice', labelKey: 'carbRice' }, { value: 'Corn', labelKey: 'carbCorn' },
    { value: 'Cassava', labelKey: 'carbCassava' }, { value: 'Potatoes', labelKey: 'carbPotatoes' },
    { value: 'Bread/Noodles', labelKey: 'carbBreadNoodles' }, { value: 'Bubur', labelKey: 'carbPorridge' },
];
const carbSources24 = [
    { value: 'Rice', labelKey: 'carbRice' }, { value: 'Corn', labelKey: 'carbCorn' },
    { value: 'Cassava', labelKey: 'carbCassava' }, { value: 'Potatoes', labelKey: 'carbPotatoes' },
    { value: 'Bread/Noodles', labelKey: 'carbBreadNoodles' },
];
const otherEssentials = [
    { value: 'Fat', labelKey: 'essentialsFat' }, { value: 'Vegetables', labelKey: 'essentialsVegetables' },
    { value: 'Fruits', labelKey: 'essentialsFruits' },
];
const otherEssentials24 = [
    { value: 'Vegetables', labelKey: 'essentialsVegetables' }, { value: 'Fruits', labelKey: 'essentialsFruits' },
];
const brushingHabitsOptions = [
    { value: 'After Breakfast', labelKey: 'brushAfterBreakfast' },
    { value: 'Before Bed', labelKey: 'brushBeforeBed' },
];

const calculateAgeInMonths = (dob: string): number | null => {
    if (!dob) return null;
    const parts = dob.split('-');
    // Pastikan tahun diisi lengkap (minimal 4 digit) sebelum menghitung usia
    if (parts[0] && parts[0].length < 4) return null;
    
    const dobDate = new Date(dob);
    const today = new Date();
    if (isNaN(dobDate.getTime()) || dobDate > today) return 0;
    
    let months = (today.getFullYear() - dobDate.getFullYear()) * 12;
    months -= dobDate.getMonth();
    months += today.getMonth();
    if (today.getDate() < dobDate.getDate()) {
        months--;
    }
    return months <= 0 ? 0 : months;
};


const StuntingScreening: React.FC<StuntingScreeningProps> = ({ 
    patientData, 
    stuntingData, 
    onPatientDataChange, 
    onStuntingDataChange,
    records,
}) => {
  const { t, language } = useLanguage();
  const ageInMonths = useMemo(() => calculateAgeInMonths(patientData.dob), [patientData.dob]);
  const isAdult = useMemo(() => ageInMonths !== null && ageInMonths >= 180, [ageInMonths]); // >= 15 years
  const isFemaleAdult = useMemo(() => isAdult && patientData.gender === 'Female', [isAdult, patientData.gender]);
  const [historyRecords, setHistoryRecords] = useState<ScreeningRecord[]>([]);
  
  const isUnder5 = useMemo(() => ageInMonths !== null && ageInMonths <= 60, [ageInMonths]);
  const isUnsupportedRange = useMemo(() => ageInMonths !== null && ageInMonths > 60 && ageInMonths < 180, [ageInMonths]);

  // Handle automatic gender lock for adults
  useEffect(() => {
      if (isAdult && patientData.gender !== 'Female') {
          onPatientDataChange({ ...patientData, gender: 'Female' });
      }
  }, [isAdult, patientData.gender, onPatientDataChange, patientData]);

  useEffect(() => {
    if (patientData.nik && patientData.nik.length > 5) {
        const patientRecords = records.filter(r => r.patientData.nik === patientData.nik.trim());
        setHistoryRecords(patientRecords);
    } else {
        setHistoryRecords([]);
    }
  }, [patientData.nik, records]);

  useEffect(() => {
    let newAgeGroup: '0-24' | '>24' | 'Adult' | null = null;
    if (ageInMonths !== null) {
      if (ageInMonths >= 180) { // 15 years
          newAgeGroup = 'Adult';
      } else if (ageInMonths <= 24) {
        newAgeGroup = '0-24';
      } else if (ageInMonths <= 60) {
        newAgeGroup = '>24';
      }
    }

    if (newAgeGroup !== stuntingData.ageGroup) {
      const updatedData = { ...stuntingData, ageGroup: newAgeGroup };
      onStuntingDataChange(updatedData);
    }
  }, [ageInMonths, stuntingData.ageGroup, onStuntingDataChange]);


  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onPatientDataChange({ ...patientData, [e.target.name]: e.target.value });
  };
  
  const handleStuntingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onStuntingDataChange({ ...stuntingData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    const currentValues = (stuntingData[name as keyof StuntingScreeningData] as string[]) || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }
    onStuntingDataChange({ ...stuntingData, [name]: newValues });
  };

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    onStuntingDataChange({
      ...stuntingData,
      [parent]: {
        ...(stuntingData[parent as keyof StuntingScreeningData] as object),
        [child]: value
      }
    });
  };

  const LabelWithInfo: React.FC<{ text: string; info: string }> = ({ text, info }) => (
    <div className="flex items-center">
      <label className="block text-sm font-medium text-gray-700">{text}</label>
      <InfoTooltip text={info} />
    </div>
  );

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500";

  const renderQuestionnaire = () => {
    if (isUnsupportedRange) {
        return (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <div className="flex-shrink-0 text-yellow-500 mt-0.5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="ml-3 text-sm text-yellow-700 font-medium">
                    {t('ageRangeInstruction')}
                </p>
            </div>
        );
    }

    if (stuntingData.ageGroup === 'Adult' || stuntingData.ageGroup === '>24') {
        const isActuallyAdult = stuntingData.ageGroup === 'Adult';
        // Adults locked to female already, but we check for UI safety
        if (isActuallyAdult && patientData.gender !== 'Female') return null;

        const subjectStr = isActuallyAdult ? (language === 'id' ? 'Anda' : 'you') : (language === 'id' ? 'anak' : 'the child');
        const replacements = { subject: subjectStr };

        return (
            <div className="space-y-4">
                {isActuallyAdult && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-800 border-b pb-1 pt-4">{t('adultMaternalData')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('maritalStatusLabel')}</label>
                                <select name="maritalStatus" value={patientData.maritalStatus} onChange={handlePatientChange} className={inputClass}>
                                    <option value="">{t('select')}</option>
                                    <option value="Married">{t('married')}</option>
                                    <option value="Single">{t('single')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('pregnancyStatusLabel')}</label>
                                <select name="pregnancyStatus" value={patientData.pregnancyStatus} onChange={handlePatientChange} className={inputClass}>
                                    <option value="">{t('select')}</option>
                                    <option value="Pregnant">{t('pregnant')}</option>
                                    <option value="Not Pregnant">{t('notPregnant')}</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-100">
                            {t('adultInfoNote')}
                        </p>
                    </div>
                )}

                <h3 className="font-semibold text-lg text-gray-800 border-b pb-1 pt-4">{t('nutritionalStatusAndHabits')}</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('q_mainMealsPerDay', replacements)}</label>
                    <input type="number" name="mainMealsPerDay" value={stuntingData.mainMealsPerDay} onChange={handleStuntingChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('q_dailyDietIncludes', replacements)}</label>
                    <div className="mt-2 space-y-2">
                        <div>
                            <p className="font-medium text-xs text-gray-600">{t('proteinSources')}:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                                {proteinSources.map(item => (
                                    <label key={item.value} className="flex items-center"><input type="checkbox" name="dailyDietIncludes" value={item.value} checked={stuntingData.dailyDietIncludes.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-xs text-gray-600">{t('carbSources')}:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                                {carbSources24.map(item => (
                                    <label key={item.value} className="flex items-center"><input type="checkbox" name="dailyDietIncludes" value={item.value} checked={stuntingData.dailyDietIncludes.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-xs text-gray-600">{t('otherEssentials')}:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                                {otherEssentials24.map(item => (
                                    <label key={item.value} className="flex items-center"><input type="checkbox" name="dailyDietIncludes" value={item.value} checked={stuntingData.dailyDietIncludes.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <LabelWithInfo text={t('q_isPickyEater', replacements)} info={t('info_isPickyEater', replacements)} />
                    <select name="isPickyEater" value={stuntingData.isPickyEater} onChange={handleStuntingChange} className={inputClass}>
                        <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
                    </select>
                </div>
                {stuntingData.isPickyEater === 'yes' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('q_pickyEaterFoods', replacements)}</label>
                        <input type="text" name="pickyEaterFoods" value={stuntingData.pickyEaterFoods} onChange={handleStuntingChange} placeholder={t('ph_pickyEaterFoods')} className={inputClass} />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('q_snackFrequency_24', replacements)}</label>
                    <input type="text" name="snackFrequencyOutside" value={stuntingData.snackFrequencyOutside} onChange={handleStuntingChange} placeholder={t('ph_snackFrequency')} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('q_favoriteSnack', replacements)}</label>
                    <input type="text" name="favoriteSnack" value={stuntingData.favoriteSnack} onChange={handleStuntingChange} placeholder={t('ph_favoriteSnack')} className={inputClass} />
                </div>
                <div>
                    <LabelWithInfo text={t('q_weeklyConsumption_soda', replacements)} info={t('info_weeklyConsumption_soda')} />
                    <input type="text" name="weeklyConsumption.soda" value={stuntingData.weeklyConsumption.soda} onChange={handleNestedChange} placeholder={t('ph_weeklyConsumption')} className={inputClass} />
                </div>
                <div>
                    <LabelWithInfo text={t('q_weeklyConsumption_packagedSnacks', replacements)} info={t('info_weeklyConsumption_packagedSnacks')} />
                    <input type="text" name="weeklyConsumption.packagedSnacks" value={stuntingData.weeklyConsumption.packagedSnacks} onChange={handleNestedChange} placeholder={t('ph_weeklyConsumption')} className={inputClass} />
                </div>
                <div>
                    <LabelWithInfo text={t('q_weeklyConsumption_sweets', replacements)} info={t('info_weeklyConsumption_sweets')} />
                    <input type="text" name="weeklyConsumption.sweets" value={stuntingData.weeklyConsumption.sweets} onChange={handleNestedChange} placeholder={t('ph_weeklyConsumption')} className={inputClass} />
                </div>
                <div>
                    <LabelWithInfo text={t('q_weeklyConsumption_fastFood', replacements)} info={t('info_weeklyConsumption_fastFood')} />
                    <input type="text" name="weeklyConsumption.fastFood" value={stuntingData.weeklyConsumption.fastFood} onChange={handleNestedChange} placeholder={t('ph_weeklyConsumption')} className={inputClass} />
                </div>
                <div>
                    <LabelWithInfo text={t('q_brushingFrequency', replacements)} info={t('info_brushingFrequency', replacements)} />
                    <input type="number" name="brushingFrequency" value={stuntingData.brushingFrequency} onChange={handleStuntingChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('q_brushingHabits')}</label>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                        {brushingHabitsOptions.map(item => (
                            <label key={item.value} className="flex items-center"><input type="checkbox" name="brushingHabits" value={item.value} checked={stuntingData.brushingHabits.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                        ))}
                    </div>
                </div>
                <div>
                    <LabelWithInfo text={t('q_dentalPain', replacements)} info={t('info_dentalPain', replacements)} />
                    <select name="dentalPain" value={stuntingData.dentalPain} onChange={handleStuntingChange} className={inputClass}>
                        <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
                    </select>
                </div>
            </div>
        );
    }

    if (stuntingData.ageGroup === '0-24') {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-1 pt-4">{t('nutritionalStatusAndHabits')}</h3>
          <div>
            <LabelWithInfo text={t('q_exclusiveBreastfeeding')} info={t('info_exclusiveBreastfeeding')} />
            <select name="exclusiveBreastfeeding" value={stuntingData.exclusiveBreastfeeding} onChange={handleStuntingChange} className={inputClass}>
                <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
            </select>
          </div>
          <div>
            <LabelWithInfo text={t('q_sugarInFormula')} info={t('info_sugarInFormula')} />
            <select name="sugarInFormula" value={stuntingData.sugarInFormula} onChange={handleStuntingChange} className={inputClass}>
                <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_mpasiStartDate')}</label>
            <input type="number" name="mpasiStartDate" value={stuntingData.mpasiStartDate} onChange={handleStuntingChange} className={inputClass} />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_mpasiTexture')}</label>
            <input type="text" name="mpasiTexture" value={stuntingData.mpasiTexture} onChange={handleStuntingChange} placeholder={t('ph_mpasiTexture')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_mpasiMenu')}</label>
            <div className="mt-2 space-y-2">
                <div>
                    <p className="font-medium text-xs text-gray-600">{t('proteinSources')}:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                        {proteinSources.map(item => (
                            <label key={item.value} className="flex items-center"><input type="checkbox" name="mpasiMenu" value={item.value} checked={stuntingData.mpasiMenu.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="font-medium text-xs text-gray-600">{t('carbSources')}:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                        {carbSources024.map(item => (
                            <label key={item.value} className="flex items-center"><input type="checkbox" name="mpasiMenu" value={item.value} checked={stuntingData.mpasiMenu.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="font-medium text-xs text-gray-600">{t('otherEssentials')}:</p>
                     <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                        {otherEssentials.map(item => (
                            <label key={item.value} className="flex items-center"><input type="checkbox" name="mpasiMenu" value={item.value} checked={stuntingData.mpasiMenu.includes(item.value)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><span className="ml-2 text-sm text-gray-700">{t(item.labelKey as any)}</span></label>
                        ))}
                    </div>
                </div>
            </div>
          </div>
           <div>
            <LabelWithInfo text={t('q_sleepWithBottle')} info={t('info_sleepWithBottle')} />
            <select name="sleepWithBottle" value={stuntingData.sleepWithBottle} onChange={handleStuntingChange} className={inputClass}>
                <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_snackFrequency_0_24')}</label>
            <input type="text" name="snackFrequency" value={stuntingData.snackFrequency} onChange={handleStuntingChange} placeholder={t('ph_snackFrequency')} className={inputClass} />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_snackType')}</label>
            <input type="text" name="snackType" value={stuntingData.snackType} onChange={handleStuntingChange} placeholder={t('ph_snackType')} className={inputClass} />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_sweetDrinkFrequency')}</label>
            <input type="text" name="sweetDrinkFrequency" value={stuntingData.sweetDrinkFrequency} onChange={handleStuntingChange} placeholder={t('ph_sweetDrinkFrequency')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('q_gumCleaningStartDate')}</label>
            <input type="number" name="gumCleaningStartDate" value={stuntingData.gumCleaningStartDate} onChange={handleStuntingChange} className={inputClass} />
          </div>
           <div>
             <LabelWithInfo text={t('q_useSpecialToothpaste')} info={t('info_useSpecialToothpaste')} />
             <select name="useSpecialToothpaste" value={stuntingData.useSpecialToothpaste} onChange={handleStuntingChange} className={inputClass}>
                <option value="">{t('select')}</option><option value="yes">{t('yes')}</option><option value="no">{t('no')}</option>
            </select>
          </div>
        </div>
      );
    }
    return <p className="text-gray-500 text-center mt-4">{t('enterAgePrompt')}</p>;
  }

  return (
    <div className="w-full flex flex-col items-center">
       <h2 className="text-2xl font-bold text-gray-700 mb-1">{t('step1Title')}</h2>
       <p className="text-gray-500 mb-6">{t('step1Subtitle')}</p>
      <div className="w-full max-w-md space-y-4">
        
        <h3 className="font-semibold text-lg text-gray-800 border-b pb-1">{t('patientIdentity')}</h3>

        {isAdult && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start mb-2 animate-pulse">
                <div className="text-blue-500 mr-3 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-xs text-blue-700 font-bold leading-relaxed">
                    {t('adultAnnouncement')}
                </p>
            </div>
        )}

        <div>
          <label htmlFor="nik" className="block text-sm font-medium text-gray-700">{t('nikLabel')}</label>
          <input type="text" name="nik" id="nik" value={patientData.nik} onChange={handlePatientChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
          <input type="text" name="name" id="name" value={patientData.name} onChange={handlePatientChange} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">{t('dobLabel')}</label>
                <input type="date" name="dob" id="dob" value={patientData.dob} onChange={handlePatientChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">{t('genderLabel')}</label>
                <select 
                    name="gender" 
                    id="gender" 
                    value={patientData.gender} 
                    onChange={handlePatientChange} 
                    className={inputClass}
                    disabled={isAdult}
                >
                    <option value="">{t('selectGender')}</option>
                    {!isAdult && <option value="Male">{t('male')}</option>}
                    <option value="Female">{t('female')}</option>
                </select>
                {isAdult && <p className="text-[10px] text-teal-600 font-medium mt-1">{t('genderLockedAdult')}</p>}
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    {t('weightLabel')}
                </label>
                <input type="number" name="weight" id="weight" value={patientData.weight} onChange={handlePatientChange} className={inputClass} />
            </div>
             <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                    {t('heightLabel')}
                </label>
                <input type="number" name="height" id="height" value={patientData.height} onChange={handlePatientChange} className={inputClass} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isUnder5 && (
                <div>
                    <label htmlFor="headCircumference" className="block text-sm font-medium text-gray-700">{t('headCircumferenceLabel')}</label>
                    <input type="number" name="headCircumference" id="headCircumference" value={patientData.headCircumference} onChange={handlePatientChange} className={inputClass} />
                </div>
            )}
            <div>
                <label htmlFor="armCircumference" className="block text-sm font-medium text-gray-700">
                    {t('armCircumferenceLabel')}
                </label>
                <input type="number" name="armCircumference" id="armCircumference" value={patientData.armCircumference} onChange={handlePatientChange} className={inputClass} />
                {(isAdult || (ageInMonths !== null && ageInMonths > 60)) && (
                    <p className="text-[10px] text-gray-500 italic mt-1">{t('lilaAdultHint')}</p>
                )}
            </div>
        </div>

        {historyRecords.length > 1 && (
            <div className="pt-4 mt-4 border-t">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{t('patientHistory')}</h3>
                <PatientHistoryChart patientRecords={historyRecords} />
            </div>
        )}
        
        {renderQuestionnaire()}
      </div>
    </div>
  );
};

export default StuntingScreening;
