import cv2
import base64
import numpy as np

class ComputerVisionModel:
    def __init__(self, min_area=100):
        #The minimum area of the shape to be detected
        self.min_area = min_area
        #Allowed shapes
        self.shapes = ["triangle", "square", "rectangle", "circle"]
    
    def detect_shape(self, image_base64, hsv_color_ranges: list[tuple[list,list]]) -> list:
        image = self._decode_image(image_base64=image_base64)
        if image is None:
            return []
        
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mask = None
        for lower, upper in hsv_color_ranges:
            lower_np = np.array(lower)
            upper_np = np.array(upper)
            current_mask = cv2.inRange(hsv, lower_np, upper_np)
            mask = current_mask if mask is None else cv2.bitwise_or(mask, current_mask)

        mask_uint8 = np.ascontiguousarray(mask, dtype=np.uint8)

        #Get all the bounding lines of the colors detected
        contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        shapes = []
        for cnt in contours:
            #Shape must be within the minimum allowed area, otherwise we ignore
            if cv2.contourArea(cnt) > self.min_area:
                shape_type = self._determine_shape_type(cnt)
                if shape_type in self.shapes: 
                    shapes.append(shape_type)
        return shapes
    
    @staticmethod 
    def _determine_shape_type(contor_map) -> str:
        #estimate the number of vertices from the contor map
        #-epsilon = 4% for better approximation for circles
        vertices_approx  = cv2.approxPolyDP(contor_map, 0.04 * cv2.arcLength(contor_map, True), True)
        shape_type = ''

        if len(vertices_approx) == 3:
            return"triangle" 

        if len(vertices_approx) == 4:
            _, _, w, h = cv2.boundingRect(vertices_approx)
            aspect_ratio = float(w) / h

            #For squares, they should have almost the same width and height(aspect ratio should be close to 1)
            if 0.90 <= aspect_ratio <= 1.10:
                return "square"
            else:
                return "rectangle"
        
        #Anything with verticies more than 4 could potentially be a circle
        #-For an exact shape, we 
        if len(vertices_approx) > 4:
            area = cv2.contourArea(contor_map)
            perimeter = cv2.arcLength(contor_map, True)
            if perimeter == 0:
                return ''
            #For a circles, the circularity should be 1(or really close to it)
            circularity = 4 * np.pi * (area / (perimeter * perimeter))
            if circularity > 0.7:
                shape_type = "circle"

        return shape_type
    

    @staticmethod
    def _decode_image(image_base64):
        try:
            image_data = base64.b64decode(image_base64)
            np_arr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None