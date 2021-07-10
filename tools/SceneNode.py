class SceneNode:
	def __init__(self, name, model=None, position=None, scale=None, rotation=None):
		self.data = {}
		self.data['name'] = name
		if model:
			self.data['model'] = model
		if position:
			self.data['position'] = position
		if scale:
			self.data['scale'] = scale
		if rotation:
			self.data['rotation'] = rotation
		self.data['children'] = []

	def append_child(self, child):
		self.data['children'].append(child.get_data())

	def get_data(self):
		return self.data

	def get_coords(self):
		pos = self.data['position']
		return [pos[0], pos[2]]