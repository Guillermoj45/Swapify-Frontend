import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';


const cld = new Cloudinary({ cloud: { cloudName: 'dflz0gveu' } });

const cloudinaryImage = (image:string) => {


  // Use this sample image or upload your own via the Media Explorer
  const img = cld
        .image(image)
        .format('auto') // Optimize delivery by resizing and applying auto-format and auto-quality
        .quality('auto')
        .resize(auto().gravity(autoGravity())); // Transform the image: auto-crop to square aspect_ratio

        return img.toURL();
};

export default cloudinaryImage