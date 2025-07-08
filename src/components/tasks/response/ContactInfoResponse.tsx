import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Phone, Building, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  title?: string;
  address?: string;
}

interface ContactInfoResponseProps {
  taskId: string;
  value?: { contact?: ContactInfo };
  onSave: (value: { contact: ContactInfo }) => void;
  label?: string;
  showCompany?: boolean;
  showTitle?: boolean;
  showAddress?: boolean;
  required?: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    company?: boolean;
    title?: boolean;
    address?: boolean;
  };
  disabled?: boolean;
}

/**
 * Component for contact information responses
 */
const ContactInfoResponse: React.FC<ContactInfoResponseProps> = ({
  taskId,
  value = {},
  onSave,
  label = "Yhteystiedot",
  showCompany = false,
  showTitle = false,
  showAddress = false,
  required = {
    name: true,
    email: true,
    phone: false,
  },
  disabled = false,
}) => {
  const initialContact: ContactInfo = {
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    address: "",
  };

  const [contact, setContact] = useState<ContactInfo>(
    value?.contact || initialContact
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local state when external value changes
  useEffect(() => {
    if (value?.contact) {
      setContact({
        ...initialContact,
        ...value.contact,
      });
    }
  }, [value?.contact]);

  const handleChange = (
    field: keyof ContactInfo,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedContact = {
      ...contact,
      [field]: e.target.value,
    };

    setContact(updatedContact);
    setIsDirty(true);

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (required.name && !contact.name.trim()) {
      newErrors.name = "Nimi on pakollinen";
    }

    if (required.email && !contact.email.trim()) {
      newErrors.email = "Sähköposti on pakollinen";
    } else if (
      required.email &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(contact.email)
    ) {
      newErrors.email = "Virheellinen sähköpostiosoite";
    }

    if (required.phone && !contact.phone.trim()) {
      newErrors.phone = "Puhelinnumero on pakollinen";
    }

    if (required.company && showCompany && !contact.company?.trim()) {
      newErrors.company = "Yritys on pakollinen";
    }

    if (required.title && showTitle && !contact.title?.trim()) {
      newErrors.title = "Titteli on pakollinen";
    }

    if (required.address && showAddress && !contact.address?.trim()) {
      newErrors.address = "Osoite on pakollinen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!isDirty) return;

    const isValid = validateForm();
    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave({ contact });
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving contact info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = (): boolean => {
    if (required.name && !contact.name) return false;
    if (required.email && !contact.email) return false;
    if (required.phone && !contact.phone) return false;
    if (required.company && showCompany && !contact.company) return false;
    if (required.title && showTitle && !contact.title) return false;
    if (required.address && showAddress && !contact.address) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {label && <Label className="text-base font-medium">{label}</Label>}

      <div className="space-y-3">
        <div className="space-y-2">
          <Label
            htmlFor={`contact-name-${taskId}`}
            className={`text-sm ${errors.name ? "text-red-500" : ""}`}
          >
            Nimi {required.name && <span className="text-red-500">*</span>}
          </Label>
          <div className="flex">
            <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id={`contact-name-${taskId}`}
              value={contact.name}
              onChange={(e) => handleChange("name", e)}
              placeholder="Etu- ja sukunimi"
              className={`rounded-l-none ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={disabled}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`contact-email-${taskId}`}
            className={`text-sm ${errors.email ? "text-red-500" : ""}`}
          >
            Sähköposti {required.email && <span className="text-red-500">*</span>}
          </Label>
          <div className="flex">
            <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id={`contact-email-${taskId}`}
              type="email"
              value={contact.email}
              onChange={(e) => handleChange("email", e)}
              placeholder="esimerkki@domain.fi"
              className={`rounded-l-none ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={disabled}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`contact-phone-${taskId}`}
            className={`text-sm ${errors.phone ? "text-red-500" : ""}`}
          >
            Puhelinnumero {required.phone && <span className="text-red-500">*</span>}
          </Label>
          <div className="flex">
            <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id={`contact-phone-${taskId}`}
              type="tel"
              value={contact.phone}
              onChange={(e) => handleChange("phone", e)}
              placeholder="+358 40 1234567"
              className={`rounded-l-none ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={disabled}
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

        {showCompany && (
          <div className="space-y-2">
            <Label
              htmlFor={`contact-company-${taskId}`}
              className={`text-sm ${errors.company ? "text-red-500" : ""}`}
            >
              Yritys {required.company && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex">
              <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id={`contact-company-${taskId}`}
                value={contact.company}
                onChange={(e) => handleChange("company", e)}
                placeholder="Yrityksen nimi"
                className={`rounded-l-none ${errors.company ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                disabled={disabled}
              />
            </div>
            {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
          </div>
        )}

        {showTitle && (
          <div className="space-y-2">
            <Label
              htmlFor={`contact-title-${taskId}`}
              className={`text-sm ${errors.title ? "text-red-500" : ""}`}
            >
              Titteli {required.title && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={`contact-title-${taskId}`}
              value={contact.title}
              onChange={(e) => handleChange("title", e)}
              placeholder="Tehtävänimike"
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
              disabled={disabled}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>
        )}

        {showAddress && (
          <div className="space-y-2">
            <Label
              htmlFor={`contact-address-${taskId}`}
              className={`text-sm ${errors.address ? "text-red-500" : ""}`}
            >
              Osoite {required.address && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex">
              <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id={`contact-address-${taskId}`}
                value={contact.address}
                onChange={(e) => handleChange("address", e)}
                placeholder="Katuosoite, postinumero, kaupunki"
                className={`rounded-l-none ${errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                disabled={disabled}
              />
            </div>
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving || disabled || !isDirty || !isComplete()}
        className="w-full mt-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Tallennetaan...
          </>
        ) : (
          "Tallenna yhteystiedot"
        )}
      </Button>

      {isDirty && !isComplete() && (
        <p className="text-xs text-red-500">Täytä kaikki pakolliset kentät (*)</p>
      )}

      {!isDirty && value?.contact && value.contact.name && (
        <Card className="mt-2 bg-muted/50">
          <CardContent className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <p className="font-medium">{value.contact.name}</p>
            </div>
            {value.contact.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <p>{value.contact.email}</p>
              </div>
            )}
            {value.contact.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <p>{value.contact.phone}</p>
              </div>
            )}
            {showCompany && value.contact.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <p>{value.contact.company}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactInfoResponse;