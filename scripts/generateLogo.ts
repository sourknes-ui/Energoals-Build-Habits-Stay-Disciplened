import { GoogleGenAI } from "@google/genai";

async function generateLogo() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `A bold, centered, geometric gorilla-head emblem dominates the composition. The logo is constructed in a highly stylized, angular vector form, using a stark black-and-white palette with strong symmetry and sharp polygonal edges. The outer silhouette forms a broad, faceted hood or shield-like shape around the head, rendered in deep black with a thin white outline that cleanly separates it from the background. Inside this outer mass, a second white angular border traces the inner contour, creating a layered crest effect and adding depth and structure.

At the center, the gorilla’s face is simplified into powerful, blocky planes. The forehead and upper head area are solid black, descending into a pronounced white brow ridge that stretches horizontally and slightly downward at the edges, giving the face an intense, focused expression. Beneath it, the eyes appear as narrow black slits recessed under the heavy brow, conveying severity and strength. The nose is reduced to a compact, sharply faceted black shape, while the muzzle is a large, bright white polygon with clipped corners and clean edges, occupying the lower central portion of the face. Below that, a separate smaller white geometric chin piece reinforces the structure of the jaw. The cheeks and side facial planes are suggested through alternating black and white angular cuts, creating a carved, mask-like appearance. Overall, the logo feels modern, aggressive, and emblematic—like an esports insignia or a powerful mascot badge.

The background is a smooth, luminous purple gradient filling the entire square canvas. It transitions from a lighter lavender-violet tone on the left side into a richer, more saturated magenta-purple toward the right, creating a soft lateral flow of color. A subtle darker purple wave-like shadow or smoky streak curves behind the lower right side of the emblem, adding motion and dimensional atmosphere without distracting from the central mark. The logo itself casts a soft, diffused drop shadow, slightly down and to the right, giving it a lifted, floating effect against the glossy gradient field. The overall background feels vibrant, energetic, and polished, with a clean digital poster-like finish.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  } catch (error) {
    console.error("Error generating logo:", error);
  }
  return null;
}

// This script is meant to be run once to generate the logo.
// In a real app, you'd do this during build or have the image pre-generated.
// For this environment, I'll use this logic to get the base64 and then create the file.
