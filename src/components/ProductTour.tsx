// ProductTour.tsx
import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface ProductTourProps {
  isRunning?: boolean;
  onFinish?: () => void;
  steps: Step[];
}

const ProductTour: React.FC<ProductTourProps> = ({ 
  isRunning = false, 
  onFinish, 
  steps 
}) => {
  const [run, setRun] = useState<boolean>(isRunning);

  // Update state when isRunning changes
  useEffect(() => {
    setRun(isRunning);
  }, [isRunning]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      if (onFinish) {
        onFinish();
      }
    }

    console.log('Joyride status:', data);
  };

  // Suomenkieliset käännökset nappuloille
  const locale = {
    back: 'Takaisin',
    close: 'Sulje',
    last: 'Valmis',
    next: 'Seuraava',
    open: 'Avaa opastus',
    skip: 'Ohita'
  };

  // Mukautettu edistymistekstin generointi suomeksi
  const getProgressLabel = (stepIndex: number, totalSteps: number) => {
    return `Seuraava (Vaihe ${stepIndex} / ${totalSteps})`;
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={false}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      locale={locale}
      // Mukautettu edistymisteksti
      getNextLabel={getProgressLabel}
      styles={{
        options: {
          primaryColor: '#3498db',
        },
      }}
    />
  );
};

export default ProductTour;