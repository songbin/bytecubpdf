class IntentVO:
    def __init__(self, intent_code, confidence, entities):
        self.intent = intent
        self.confidence = confidence
        self.entities = entities
    def __str__(self):
        return "IntentVO(intent={}, confidence={}, entities={})".format(self.intent, self.confidence, self.entities)
    def __repr__(self):
        return self.__str__()