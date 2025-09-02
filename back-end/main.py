from ComputerVisionModel import ComputerVisionModel
import base64

#-Predefined color ranges with their HSV lower and upper values 
#TODO: Make these dynamic/configurable
color_ranges = {
    "red":    [([0, 100, 100], [10, 255, 255]), ([160, 100, 100], [179, 255, 255])],
    "blue":   [([100, 150, 0], [140, 255, 255])], #blue may need to increase the saturation(upperbound)
    "green":  [([40, 70, 70], [80, 255, 255])],
    "yellow": [([20, 100, 100], [30, 255, 255])],
    "orange": [([10, 100, 100], [20, 255, 255])],
    "purple": [([140, 100, 100], [160, 255, 255])]#purple identified as blue(I may need to decrease the saturation upper bound and lower bound)
}

#@Galane if you need to test this code
#run this script and pass in the image url(locally) below to the 
img_url = r'...'

with open(img_url, 'rb') as image_file:
    image_data = image_file.read()
    encoded_image = base64.b64encode(image_data).decode('utf-8')

color_to_detect = color_ranges["red"]
model = ComputerVisionModel()
print(model.detect_shape(encoded_image, color_to_detect))