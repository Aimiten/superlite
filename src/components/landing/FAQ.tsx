import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Miten Arvento eroaa perinteisestä konsultista?",
      answer: "Arvento analysoi tilinpäätöksesi tekoälyllä ja tunnistaa samat normalisointitarpeet kuin kokenut konsultti. Ero on nopeudessa (30min vs. 2-4 viikkoa) ja hinnassa (99€/kk vs. 5000-20000€). Saat saman lopputuloksen: normalisoidut luvut, toimialakertoimet ja perustellun arvonmäärityksen."
    },
    {
      question: "Kuinka tarkka arvonmääritys on?",
      answer: "Arvento käyttää samoja menetelmiä kuin arvonmäärityksen ammattilaiset: 6 eri arvostusmenetelmää, toimialakohtaiset kertoimet ja normalisoidut luvut. Tarkuus on ±20%, mikä on normaali vaihteluväli myös konsulttien arvioissa. Todellinen hinta määräytyy aina neuvotteluissa."
    },
    {
      question: "Mitä tietoja tarvitsen?",
      answer: "Tarvitset vain 1-3 vuoden tilinpäätökset PDF-muodossa. Arvento tunnistaa automaattisesti puuttuvat tiedot ja kysyy sinulta 3-6 tarkentavaa kysymystä, kuten yrittäjän markkinaehtoinen palkka tai kertaluonteiset erät."
    },
    {
      question: "Voinko käyttää tuloksia pankkineuvotteluissa?",
      answer: "Kyllä. Arvento tuottaa ammattimaisen raportin, joka sisältää normalisoidut luvut, laskennan perusteet ja toimialakertoimet. Monet käyttäjämme ovat käyttäneet raporttia onnistuneesti rahoitusneuvotteluissa."
    },
    {
      question: "Kuka näkee tietoni?",
      answer: "Vain sinä. Tiedot käsitellään turvallisesti suomalaisilla palvelimilla, ja ne poistetaan automaattisesti 30 päivän kuluttua, jos et tallenna niitä. Voit myös poistaa kaikki tiedot välittömästi itse."
    },
    {
      question: "Sopiiko Arvento henkilöyhtiöille?",
      answer: "Kyllä! Arvento tunnistaa automaattisesti yhtiömuodon ja osaa käsitellä sekä osakeyhtiöitä että henkilöyhtiöitä (toiminimi, avoin yhtiö, kommandiittiyhtiö). Henkilöyhtiöille kysytään erityiskysymyksiä yrittäjän palkan normalisoimiseksi."
    },
    {
      question: "Mitä teen arvonmäärityksen jälkeen?",
      answer: "Saat konkreettiset toimenpidesuositukset arvon kasvattamiseksi. Pro-versiossa voit seurata kehitystä kuukausittain ja simuloida eri skenaarioiden vaikutusta arvoon. Keskimäärin asiakkaamme nostavat yrityksen arvoa 15-30% 1-2 vuodessa."
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Usein kysytyt kysymykset
          </h2>
          <p className="text-lg text-muted-foreground">
            Löydä vastaukset yleisimpiin kysymyksiin Arventosta
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-background rounded-xl shadow-neumorphic overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/20 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-foreground pr-4">
                  {faq.question}
                </h3>
                <ChevronDown 
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Eikö kysymystäsi löydy?{' '}
            <a href="mailto:tuki@arvento.fi" className="text-primary hover:underline">
              Ota yhteyttä: tuki@arvento.fi
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;