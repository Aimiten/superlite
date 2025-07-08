// Utility function to read a file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // PDF:t ovat binääritiedostoja - älä lue niitä tekstinä!
    if (file.type === "application/pdf") {
      console.warn("PDF files should not be read as text, returning empty string");
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Utility function to read a file as binary and convert to base64
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Convert ArrayBuffer to Base64 if needed
        if (event.target.result instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.target.result);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          resolve(btoa(binary));
        } else {
          // If the result is already a base64 string (readAsDataURL)
          const base64String = event.target.result.toString();
          // Poista data URL prefix jos se on olemassa
          const base64 = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          resolve(base64);
        }
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};