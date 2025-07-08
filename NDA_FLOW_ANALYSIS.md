# NDA Generation Flow Analysis Report

## Executive Summary

The NDA generation system has a fundamental misunderstanding of context. It treats all NDAs as if they're for M&A negotiations (yrityskauppaneuvottelut) when they should be for information sharing evaluation (tietojen jakaminen arviointia varten).

## 1. Data Flow Analysis

### Frontend → Edge Function

**Frontend sends (SharingManager.tsx, line 430-472):**
```javascript
{
  companyId: selectedCompany,
  context: 'sharing',
  sharingData: {
    shareId,
    sharedItems: {
      valuation: shareValuation,      // boolean
      assessment: shareAssessment,    // boolean
      documents: selectedDocuments,   // array of {id, source, name}
      tasks: selectedTasks           // array of task IDs
    },
    recipientEmail: shareEmail
  },
  formData: {
    type: 'unilateral',
    template: ndaConfig.template,    // 'sale_process', 'investment', etc.
    disclosingParty: { name, businessId, address, email },
    receivingParty: { name, email },
    terms: {
      duration: ndaConfig.duration,
      effectiveDate: new Date().toISOString().split('T')[0],
      confidentialInfo: [],          // Empty array!
      exceptions: [...],
      governingLaw: 'finland',
      disputeResolution: 'court',
      courtLocation: 'Helsinki',
      specificConfidentialInfo: ndaConfig.specificInfo,
      additionalTerms: ndaConfig.additionalTerms
    }
  }
}
```

### Edge Function Processing (generate-nda/index.ts)

**What it receives vs what it expects:**
- Receives: `formData.template` = 'sale_process'
- Expects: `formData.terms.confidentialPurpose`
- Result: Falls back to default 'yrityskauppakontekstiin' (M&A context)

## 2. Template Misunderstanding

### Current Template Mapping (SmartNDASection.tsx, line 149-172)
```
sale_process → "Yrityskauppaneuvottelut" (M&A negotiations)
investment → "Sijoittajaneuvottelut" (Investor negotiations)  
partnership → "Yhteistyöneuvottelut" (Partnership negotiations)
custom → "Muu tarkoitus" (Other purpose)
```

**Problem:** These templates describe WHO is receiving data for WHAT PURPOSE, not the nature of the transaction.

### What Actually Happens
1. User shares valuation/assessment data for evaluation
2. User selects "sale_process" thinking it means "I'm sharing sales process data"
3. System interprets it as "This is an M&A negotiation"
4. NDA talks about selling the company instead of sharing information

## 3. Context Problems

### Edge Function Prompt Generation (line 276-287)
```javascript
const purposeContext = formData.terms.confidentialPurpose ? {
  sale_process: 'yrityskauppaneuvotteluihin',
  investment: 'sijoittajaneuvotteluihin', 
  partnership: 'yhteistyöneuvotteluihin',
  specific: 'määriteltyyn tarkoitukseen'
}[formData.terms.confidentialPurpose] : 'yrityskauppakontekstiin';
```

**Issues:**
1. `confidentialPurpose` is never set by frontend
2. Defaults to M&A context
3. The mapping itself is wrong - assumes transaction types

### Actual Use Case
- User wants to share company valuation for evaluation
- Recipient should assess the data and potentially make an offer
- This is NOT an active M&A negotiation
- It's information sharing for due diligence

## 4. Legal Content Issues

### Current NDA Content
- "yrityskauppaneuvottelut" (M&A negotiations)
- Implies active sale process
- Creates wrong legal framework

### Should Be
- "tietojen jakaminen arviointia varten" (sharing information for evaluation)
- "mahdollisia yhteistyömahdollisuuksia varten" (for potential collaboration opportunities)
- Focus on information protection, not transaction

## 5. Missing Information

### Recipient Details
- Shows as "[Vastaanottaja]" when no email provided
- Should use "Tietojen vastaanottaja" (Information recipient)

### Shared Items
- The system correctly identifies shared items in lines 244-259
- But doesn't properly contextualize them

## 6. Required Fixes

### A. Frontend Changes (SmartNDASection.tsx)
1. Rename template options to clarify they're about recipient type:
   - `potential_buyer` → "Potentiaalinen ostaja"
   - `investor` → "Sijoittaja"  
   - `partner` → "Yhteistyökumppani"
   - `advisor` → "Neuvonantaja"

### B. Edge Function Changes (generate-nda/index.ts)
1. Map `formData.template` to proper context
2. Fix the prompt to use information sharing context
3. Update purposeContext logic

### C. Legal Language Updates
1. Replace "yrityskauppaneuvotteluihin" with "tietojen arviointiin"
2. Add context about Arvento platform
3. Clarify this is for evaluation, not active negotiation

## 7. Data Structure Recommendations

### Enhanced Request Structure
```javascript
{
  formData: {
    template: 'potential_buyer',
    terms: {
      confidentialPurpose: 'evaluation', // New field
      sharingContext: 'arvento_platform', // New field
      // ... existing fields
    }
  }
}
```

## 8. Immediate Action Items

1. **Quick Fix:** Update Edge Function to map template to purpose
2. **Medium Fix:** Rename templates to be clearer
3. **Long Fix:** Restructure entire NDA context understanding

## 9. Example of Correct NDA Opening

**Current (Wrong):**
"Tämä salassapitosopimus liittyy osapuolten välisiin yrityskauppaneuvotteluihin..."

**Should Be:**
"Tämä salassapitosopimus koskee Luovuttajan Arvento-palvelun kautta jakamia luottamuksellisia tietoja, jotka luovutetaan Vastaanottajalle arviointia ja mahdollisten yhteistyömahdollisuuksien kartoittamista varten..."

## 10. Conclusion

The system fundamentally misunderstands its own purpose. It thinks it's facilitating M&A transactions when it's actually facilitating information sharing for evaluation purposes. This creates legal and business confusion.