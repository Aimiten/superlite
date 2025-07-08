
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building, 
  Factory, 
  Users, 
  Globe,
  Award, 
  AlertTriangle, 
  Package,
  Check 
} from "lucide-react";

type CompanyData = {
  company_name?: string;
  business_id?: string;
  industry?: string;
  employees?: string;
  description?: string;
  competitive_advantages?: string[];
  market_position?: string;
  challenges?: string[];
  key_products?: string[];
  website?: string;
};

interface CompanyDataCardProps {
  structuredCompanyData: CompanyData | null;
  companyInfo: string;
}

const CompanyDataCard: React.FC<CompanyDataCardProps> = ({
  structuredCompanyData,
  companyInfo
}) => {
  if (structuredCompanyData) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Perplexityn löytämät tiedot
        </h3>
        
        <div className="space-y-6">
          {/* Company and business ID */}
          {structuredCompanyData.company_name && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="w-full sm:w-2/5">
                <div className="font-medium text-gray-500">Yritys</div>
              </div>
              <div className="w-full sm:w-3/5 flex items-center">
                <span className="text-blue-800 font-semibold">
                  {structuredCompanyData.company_name}
                </span>
                {structuredCompanyData.business_id && (
                  <Badge variant="outline" className="ml-2 bg-white">
                    {structuredCompanyData.business_id}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Industry */}
          {structuredCompanyData.industry && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="w-full sm:w-2/5">
                <div className="font-medium text-gray-500 flex items-center">
                  <Factory className="h-4 w-4 mr-2" />
                  Toimiala
                </div>
              </div>
              <div className="w-full sm:w-3/5">
                <span className="text-blue-800">
                  {structuredCompanyData.industry}
                </span>
              </div>
            </div>
          )}
          
          {/* Key metrics in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employees */}
            {structuredCompanyData.employees && (
              <div className="flex flex-col gap-1 bg-white/70 rounded-xl p-3">
                <div className="font-medium text-gray-500 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Henkilöstö
                </div>
                <div className="text-blue-800">
                  {structuredCompanyData.employees}
                </div>
              </div>
            )}
            
            {/* Website */}
            {structuredCompanyData.website && (
              <div className="flex flex-col gap-1 bg-white/70 rounded-xl p-3">
                <div className="font-medium text-gray-500 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Verkkosivu
                </div>
                <div className="text-blue-800">
                  <a 
                    href={structuredCompanyData.website.startsWith('http') 
                      ? structuredCompanyData.website 
                      : `https://${structuredCompanyData.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {structuredCompanyData.website}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Description */}
          {structuredCompanyData.description && (
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-medium text-gray-500 mb-2">Kuvaus</div>
              <p className="text-blue-800">{structuredCompanyData.description}</p>
            </div>
          )}
          
          {/* Market position */}
          {structuredCompanyData.market_position && (
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-medium text-gray-500 mb-2">Markkina-asema</div>
              <p className="text-blue-800">{structuredCompanyData.market_position}</p>
            </div>
          )}
          
          {/* Competitive advantages */}
          {structuredCompanyData.competitive_advantages && structuredCompanyData.competitive_advantages.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-medium text-gray-500 mb-2 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Kilpailuedut
              </div>
              <ul className="list-none space-y-2 mt-2">
                {structuredCompanyData.competitive_advantages.map((advantage, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-blue-800">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Challenges */}
          {structuredCompanyData.challenges && structuredCompanyData.challenges.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-medium text-gray-500 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Haasteet
              </div>
              <ul className="list-none space-y-2 mt-2">
                {structuredCompanyData.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">!</span>
                    </div>
                    <span className="text-blue-800">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Key products/services */}
          {structuredCompanyData.key_products && structuredCompanyData.key_products.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-medium text-gray-500 mb-2 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Keskeiset tuotteet/palvelut
              </div>
              <ul className="list-none space-y-2 mt-2">
                {structuredCompanyData.key_products.map((product, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-blue-800">{product}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Perplexityn löytämät tiedot</h3>
        <p className="text-blue-700">{companyInfo}</p>
      </div>
    );
  }
};

export default CompanyDataCard;
